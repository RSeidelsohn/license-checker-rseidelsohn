/*
Copyright (c) 2013, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://yuilibrary.com/license/
*/

const UNKNOWN = 'UNKNOWN';
const UNLICENSED = 'UNLICENSED';

const chalk = require('chalk');
const debug = require('debug');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const read = require('read-installed-packages');
const spdxCorrect = require('spdx-correct');
const spdxSatisfies = require('spdx-satisfies');
const treeify = require('treeify');
const createHash = require('crypto').createHash;

const getLicenseTitle = require('./getLicenseTitle');
const licenseFiles = require('./license-files');

// Set up debug logging
// https://www.npmjs.com/package/debug#stderr-vs-stdout
const debugError = debug('license-checker-rseidelsohn:error');
const debugLog = debug('license-checker-rseidelsohn:log');

debugLog.log = console.log.bind(console);

function first_or_second(obj1, obj2) {
    /*istanbul ignore next*/
    if (obj1 !== undefined) {
        return obj1;
    } else if (obj2 !== undefined) {
        return obj2;
    } else {
        return undefined;
    }
}

// This function calls itself recursively. On the first iteration, it collects the data of the main program, during the
// second iteration, it collects the data from all direct dependencies, then it collects their dependencies and so on.
const flatten = function flatten(options) {
    const moduleInfo = { licenses: UNKNOWN };
    const { color: colorize, deps: json, unknown } = options;
    const currentPackageNameAndVersion = `${json.name}@${json.version}`;
    let licenseFilesInCurrentModuleDirectory = [];
    let licenseData;
    let licenseFile;
    let noticeFiles = [];
    let readmeFile;
    let { data } = options;
    let clarification = options.clarifications?.[currentPackageNameAndVersion];
    let passed_clarification_check = clarification?.checksum ? false : true;

    if (json.private) {
        moduleInfo.private = true;
    }

    // If we have processed this currentPackageNameAndVersion already, just return the data object.
    // This was added so that we don't recurse forever if there was a circular
    // dependency in the dependency tree.
    /*istanbul ignore next*/
    if (data[currentPackageNameAndVersion]) {
        return data;
    }

    if ((options.production && json.extraneous) || (options.development && !json.extraneous && !json.root)) {
        return data;
    }

    data[currentPackageNameAndVersion] = moduleInfo;

    // Include property in output unless custom format has set property to false.
    function mustInclude(property) {
        return options?.customFormat?.[property] !== false;
    }

    if (mustInclude('repository')) {
        if (clarification?.repository) {
            moduleInfo.repository = clarification.repository;
        } else if (json.repository) {
            /*istanbul ignore else*/
            if (typeof json?.repository?.url === 'string') {
                moduleInfo.repository = json.repository.url
                    .replace('git+ssh://git@', 'git://')
                    .replace('git+https://github.com', 'https://github.com')
                    .replace('git://github.com', 'https://github.com')
                    .replace('git@github.com:', 'https://github.com/')
                    .replace(/\.git$/, '');
            }
        }
    }

    if (mustInclude('url')) {
        let url = first_or_second(clarification?.url, json?.url?.we);
        /*istanbul ignore next*/
        if (url) {
            moduleInfo.url = url;
        }
    }

    if (json.author && typeof json.author === 'object') {
        /*istanbul ignore else - This should always be there*/
        let publisher = first_or_second(clarification?.publisher, json?.author?.name);
        if (mustInclude('publisher') && publisher) {
            moduleInfo.publisher = publisher;
        }

        let email = first_or_second(clarification?.email, json?.author?.email);
        if (mustInclude('email') && email) {
            moduleInfo.email = email;
        }

        let url = first_or_second(clarification?.url, json?.author?.url);
        if (mustInclude('url') && url) {
            moduleInfo.url = url;
        }
    }

    /*istanbul ignore next*/
    if (unknown) {
        moduleInfo.dependencyPath = json.path;
    }

    let module_path = first_or_second(clarification?.path, json?.path);
    if (mustInclude('path') && typeof module_path === 'string') {
        moduleInfo.path = module_path;
    }

    licenseData = clarification?.licenses || json.license || json.licenses || undefined;

    if (module_path && (!json.readme || json.readme.toLowerCase().indexOf('no readme data found') > -1)) {
        readmeFile = path.join(module_path, 'README.md');
        /*istanbul ignore if*/
        if (fs.existsSync(readmeFile)) {
            json.readme = fs.readFileSync(readmeFile, 'utf8').toString();
        }
    }

    if (licenseData) {
        /*istanbul ignore else*/
        if (Array.isArray(licenseData) && licenseData.length > 0) {
            moduleInfo.licenses = licenseData.map((moduleLicense) => {
                /*istanbul ignore else*/
                if (typeof moduleLicense === 'object') {
                    /*istanbul ignore next*/
                    return moduleLicense.type || moduleLicense.name;
                }

                if (typeof moduleLicense === 'string') {
                    return moduleLicense;
                }
            });
        } else if (typeof licenseData === 'object' && (licenseData.type || licenseData.name)) {
            moduleInfo.licenses = getLicenseTitle(licenseData.type || licenseData.name);
        } else if (typeof licenseData === 'string') {
            moduleInfo.licenses = getLicenseTitle(licenseData);
        }
    } else if (getLicenseTitle(json.readme)) {
        moduleInfo.licenses = getLicenseTitle(json.readme);
    }

    if (Array.isArray(moduleInfo.licenses)) {
        /*istanbul ignore else*/
        if (moduleInfo.licenses.length === 1) {
            moduleInfo.licenses = moduleInfo.licenses[0];
        }
    }

    /*istanbul ignore else*/
    if (clarification?.licenseFile) {
        licenseFilesInCurrentModuleDirectory = [clarification.licenseFile];
    } else if (fs.existsSync(module_path)) {
        const filesInModuleDirectory = fs.readdirSync(module_path);
        licenseFilesInCurrentModuleDirectory = licenseFiles(filesInModuleDirectory);

        noticeFiles = filesInModuleDirectory.filter((filename) => {
            filename = filename.toUpperCase();
            const name = path.basename(filename).replace(path.extname(filename), '');

            return name === 'NOTICE';
        });
    }

    licenseFilesInCurrentModuleDirectory.forEach(function (filename, index) {
        licenseFile = path.join(module_path, filename);
        // Checking that the file is in fact a normal file and not a directory for example.
        /*istanbul ignore else*/
        if (fs.lstatSync(licenseFile).isFile()) {
            let content;

            if (
                !moduleInfo.licenses ||
                moduleInfo.licenses.indexOf(UNKNOWN) > -1 ||
                moduleInfo.licenses.indexOf('Custom:') === 0
            ) {
                //Only re-check the license if we didn't get it from elsewhere
                content = fs.readFileSync(licenseFile, { encoding: 'utf8' });

                moduleInfo.licenses = getLicenseTitle(content);
            }

            if (index === 0) {
                // Treat the file with the highest precedence as licenseFile

                if (clarification !== undefined && !passed_clarification_check) {
                    /*istanbul ignore else*/
                    if (!content) {
                        content = fs.readFileSync(licenseFile, { encoding: 'utf8' });
                    }

                    let sha256 = createHash('sha256').update(content).digest('hex');

                    if (clarification.checksum !== sha256) {
                        console.error(`Clarification checksum mismatch for ${currentPackageNameAndVersion} :(\nFile checked: ${licenseFile}`);
                        process.exit(1);
                    } else {
                        passed_clarification_check = true;
                    }
                }

                /*istanbul ignore else*/
                if (mustInclude('licenseFile')) {
                    moduleInfo.licenseFile = first_or_second(
                        clarification?.licenseFile,
                        options.basePath ? path.relative(options.basePath, licenseFile) : licenseFile,
                    );
                }

                if (mustInclude('licenseText') && options.customFormat) {
                    if (clarification?.licenseText) {
                        moduleInfo.licenseText = clarification.licenseText;
                    } else {
                        if (!content) {
                            content = fs.readFileSync(licenseFile, { encoding: 'utf8' });
                        }

                        /*istanbul ignore else*/
                        if (options._args && !options._args.csv) {
                            moduleInfo.licenseText = content.trim();
                        } else {
                            moduleInfo.licenseText = content
                                .replace(/"/g, "'")
                                .replace(/\r?\n|\r/g, ' ')
                                .trim();
                        }
                    }

                    let start_index;
                    let end_index;
                    if (clarification?.licenseStart) {
                        start_index = moduleInfo.licenseText.indexOf(clarification.licenseStart);

                        if (clarification?.licenseEnd) {
                            end_index = moduleInfo.licenseText.indexOf(clarification.licenseEnd, start_index);
                        } else {
                            end_index = moduleInfo.licenseText.length;
                        }

                        moduleInfo.licenseText = moduleInfo.licenseText.substring(start_index, end_index);
                    }
                }

                if (mustInclude('copyright') && options.customFormat) {
                    if (clarification?.copyright) {
                        moduleInfo.copyright = clarification.copyright;
                    } else {
                        if (!content) {
                            content = fs.readFileSync(licenseFile, { encoding: 'utf8' });
                        }

                        const linesWithCopyright = content
                            .replace(/\r\n/g, '\n')
                            .split('\n\n')
                            .filter(function selectCopyRightStatements(value) {
                                return (
                                    value.startsWith('opyright', 1) && // include copyright statements
                                    !value.startsWith('opyright notice', 1) && // exclude lines from from license text
                                    !value.startsWith('opyright and related rights', 1)
                                );
                            })
                            .filter(function removeDuplicates(value, index, list) {
                                return index === 0 || value !== list[0];
                            });

                        if (linesWithCopyright.length > 0) {
                            moduleInfo.copyright = linesWithCopyright[0].replace(/\n/g, '. ').trim();
                        }

                        // Mark files with multiple copyright statements. This might be
                        // an indicator to take a closer look at the LICENSE file.
                        if (linesWithCopyright.length > 1) {
                            moduleInfo.copyright = `${moduleInfo.copyright}*`;
                        }
                    }
                }
            }
        }
    });

    if (!passed_clarification_check) {
        console.error('All clarifications must come with a checksum');
        process.exit(1);
    }

    // TODO: How do clarifications interact with notice files?
    noticeFiles.forEach((filename) => {
        const file = path.join(json.path, filename);
        /*istanbul ignore else*/
        if (fs.lstatSync(file).isFile()) {
            moduleInfo.noticeFile = options.basePath ? path.relative(options.basePath, file) : file;
        }
    });

    /*istanbul ignore else*/
    if (json.dependencies) {
        Object.keys(json.dependencies).forEach((name) => {
            const childDependency = options.depth > options._args.direct ? {} : json.dependencies[name];
            const dependencyId = `${childDependency.name}@${childDependency.version}`;

            if (data[dependencyId]) {
                // already exists
                return;
            }

            data = flatten({
                _args: options._args,
                basePath: options.basePath,
                color: colorize,
                customFormat: options.customFormat,
                data,
                deps: childDependency,
                development: options.development,
                production: options.production,
                unknown,
                depth: options.depth + 1,
                clarifications: options.clarifications,
            });
        });
    }

    if (!json.name || !json.version) {
        delete data[currentPackageNameAndVersion];
    }

    /*istanbul ignore next*/
    if (options.customFormat) {
        Object.keys(options.customFormat).forEach((item) => {
            if (mustInclude(item) && moduleInfo[item] == null) {
                moduleInfo[item] = first_or_second(
                    clarification?.[item],
                    typeof json[item] === 'string' ? json[item] : options.customFormat[item],
                );
            }
        });
    }

    return data;
};

/**
 * ! This function has a wanted sideeffect, as it modifies the json object that is passed by reference.
 *
 *  The depth attribute set in the opts parameter here - which is defined by setting the `--direct` flag - is of
 *  no use with npm > 2, as the newer npm versions flatten all dependencies into one single directory. So in
 *  order to making `--direct` work with newer versions of npm, we need to filter out all non-dependencies from
 *  the json result.
 */
const removeUnwantedDependencies = (json, args) => {
    if (args.direct === 0) {
        const allDependencies = Object.keys(json.dependencies);
        let wantedDependencies = [];

        if (args.production && !args.development) {
            const devDependencies = Object.keys(json.devDependencies);
            wantedDependencies = Object.keys(json._dependencies).filter(
                (directDependency) => !devDependencies.includes(directDependency),
            );
        } else if (!args.production && args.development) {
            wantedDependencies = Object.keys(json.devDependencies);
        } else {
            wantedDependencies = Object.keys(json._dependencies);
        }

        allDependencies.forEach((currentDependency) => {
            if (!wantedDependencies.includes(currentDependency)) {
                delete json.dependencies[currentDependency];
            }
        });
    }
};

function prepareArgs(args) {
    const normalizedArgs = { ...args };
    if (args.direct === true) {
        normalizedArgs.direct = 0;
    } else if (typeof args.direct !== 'number') {
        normalizedArgs.direct = Infinity;
    }
    return normalizedArgs;
}

exports.init = function init(initArgs, callback) {
    const args = prepareArgs(initArgs);
    // Fix path if on Windows:
    const workingDir = args.start.replace(/\\\\/g, '\\');

    debugLog('scanning %s', args.start);

    if (args.customPath) {
        args.customFormat = this.parseJson(args.customPath);
    }

    const opts = {
        depth: args.direct,
        nopeer: args.nopeer,
        dev: true,
        log: debugLog,
    };

    if (args.production || args.development) {
        opts.dev = false;
    }

    const toCheckforFailOn = [];
    const toCheckforOnlyAllow = [];
    let checker;
    let pusher;

    if (args.onlyAllow) {
        checker = args.onlyAllow;
        pusher = toCheckforOnlyAllow;
    }

    if (args.failOn) {
        checker = args.failOn;
        pusher = toCheckforFailOn;
    }

    // An object mapping from Package name -> What contents it should have
    let clarifications = {};
    if (args.clarificationsFile) {
        clarifications = this.parseJson(args.clarificationsFile);
    }

    if (checker && pusher) {
        checker.split(';').forEach((license) => {
            license = license.trim();
            /*istanbul ignore else*/
            if (license.length > 0) {
                pusher.push(license);
            }
        });
    }

    read(args.start, opts, (err, json) => {
        removeUnwantedDependencies(json, args);

        const data = flatten({
            _args: args,
            basePath: args.relativeLicensePath ? json.path : null,
            color: args.color,
            customFormat: args.customFormat,
            data: {},
            deps: json,
            development: args.development,
            production: args.production,
            unknown: args.unknown,
            depth: 0,
            clarifications: clarifications,
        });

        const colorize = args.color;
        const sorted = {};
        let filtered = {};
        const excludeLicenses =
            args.excludeLicenses &&
            args.excludeLicenses
                .match(/([^\\\][^,]|\\,)+/g)
                .map((license) => license.replace(/\\,/g, ',').replace(/^\s+|\s+$/g, ''));
        const includeLicenses =
            args.includeLicenses &&
            args.includeLicenses
                .match(/([^\\\][^,]|\\,)+/g)
                .map((license) => license.replace(/\\,/g, ',').replace(/^\s+|\s+$/g, ''));
        let inputError = null;

        function colorizeString(string) {
            /*istanbul ignore next*/
            return colorize ? chalk.bold.red(string) : string;
        }

        function filterDeletePrivatePackages(privatePackage) {
            /*istanbul ignore next - I don't have access to private packages to test */
            if (resultJson[privatePackage] && resultJson[privatePackage].private) {
                delete resultJson[privatePackage];
            }
        }

        function onlyIncludeWhitelist(whitelist, filtered) {
            const resultJson = {};

            Object.keys(filtered).map((filteredPackage) => {
                // Whitelist packages by declaring:
                // 1. the package full name. Ex: `react` (we suffix an '@' to ensure we don't match packages like `react-native`)
                // 2. the package full name and the major version. Ex: `react@16`
                // 3. the package full name and full version. Ex: `react@16.0.2`
                if (
                    whitelist.findIndex((whitelistPackage) =>
                        filteredPackage.startsWith(
                            whitelistPackage.lastIndexOf('@') > 0 ? whitelistPackage : `${whitelistPackage}@`,
                        ),
                    ) !== -1
                ) {
                    resultJson[filteredPackage] = filtered[filteredPackage];
                }
            });

            return resultJson;
        }

        function excludeBlacklist(blacklist, filtered) {
            const resultJson = {};

            Object.keys(filtered).map((filteredPackage) => {
                // Blacklist packages by declaring:
                // 1. the package full name. Ex: `react` (we suffix an '@' to ensure we don't match packages like `react-native`)
                // 2. the package full name and the major version. Ex: `react@16`
                // 3. the package full name and full version. Ex: `react@16.0.2`
                if (
                    blacklist.findIndex((blacklistPackage) =>
                        filteredPackage.startsWith(
                            blacklistPackage.lastIndexOf('@') > 0 ? blacklistPackage : `${blacklistPackage}@`,
                        ),
                    ) === -1
                ) {
                    resultJson[filteredPackage] = filtered[filteredPackage];
                }
            });

            return resultJson;
        }

        function excludePackagesStartingWith(blacklist, currentResult) {
            const resultJson = { ...currentResult };

            for (const pkgName in resultJson) {
                for (const denyPrefix of blacklist) {
                    if (pkgName.startsWith(denyPrefix)) delete resultJson[pkgName];
                }
            }

            return resultJson;
        }

        function exitIfCheckHits(packageName) {
            const currentLicense = resultJson[packageName]?.licenses;

            if (currentLicense) {
                checkForFailOn(currentLicense);
                checkForOnlyAllow(currentLicense, packageName);
            }
        }

        function checkForFailOn(currentLicense) {
            if (toCheckforFailOn.length > 0) {
                if (toCheckforFailOn.indexOf(currentLicense) > -1) {
                    console.error(`Found license defined by the --failOn flag: "${currentLicense}". Exiting.`);

                    process.exit(1);
                }
            }
        }

        function checkForOnlyAllow(currentLicense, packageName) {
            if (toCheckforOnlyAllow.length > 0) {
                let hasOnlyAllowedPackages = false;

                toCheckforOnlyAllow.forEach((allowedLicense) => {
                    if (currentLicense.indexOf(allowedLicense) >= 0) {
                        hasOnlyAllowedPackages = true;
                    }
                });

                if (!hasOnlyAllowedPackages) {
                    console.error(
                        `Package "${packageName}" is licensed under "${currentLicense}" which is not permitted by the --onlyAllow flag. Exiting.`,
                    );

                    process.exit(1);
                }
            }
        }

        function transformBSD(spdx) {
            return spdx === 'BSD' ? '(0BSD OR BSD-2-Clause OR BSD-3-Clause OR BSD-4-Clause)' : spdx;
        }

        function invertResultOf(fn) {
            return (spdx) => !fn(spdx);
        }

        function spdxIsValid(spdx) {
            return spdxCorrect(spdx) === spdx;
        }

        function getLicenseMatch(licensesArr, filtered, packageName, packageData, compareLicenses) {
            const validSPDXLicenses = compareLicenses.map(transformBSD).filter(spdxIsValid);
            const invalidSPDXLicenses = compareLicenses.map(transformBSD).filter(invertResultOf(spdxIsValid));
            const spdxExcluder = `( ${validSPDXLicenses.join(' OR ')} )`;

            let match = false;

            licensesArr.forEach((license) => {
                /*istanbul ignore if - just for protection*/
                if (license.indexOf(UNKNOWN) >= 0) {
                    // Necessary due to colorization:
                    filtered[packageName] = packageData;
                } else {
                    if (license.endsWith('*')) {
                        license = license.slice(0, -1);
                    }

                    license = transformBSD(license);

                    if (
                        invalidSPDXLicenses.indexOf(license) >= 0 ||
                        (spdxCorrect(license) &&
                            validSPDXLicenses.length > 0 &&
                            spdxSatisfies(spdxCorrect(license), spdxExcluder))
                    ) {
                        match = true;
                    }
                }
            });

            return match;
        }

        Object.keys(data)
            .sort()
            .forEach((item) => {
                if (data[item].private) {
                    data[item].licenses = colorizeString(UNLICENSED);
                }

                /*istanbul ignore next*/
                if (!data[item].licenses) {
                    data[item].licenses = colorizeString(UNKNOWN);
                }

                if (
                    args.unknown &&
                    data[item].licenses &&
                    data[item].licenses !== UNKNOWN &&
                    data[item].licenses.indexOf('*') > -1
                ) {
                    /*istanbul ignore if*/
                    data[item].licenses = colorizeString(UNKNOWN);
                }
                /*istanbul ignore else*/
                if (data[item]) {
                    if (args.relativeModulePath && data[item].path != null) {
                        // Cut the absolute portion of the module path (for forward and backward slashes respectively):
                        data[item].path = data[item].path
                            .replace(`${workingDir}/`, '')
                            .replace(`${workingDir}\\`, '')
                            .replace(workingDir, '');
                    }

                    if (args.onlyunknown) {
                        if (data[item].licenses.indexOf('*') > -1 || data[item].licenses.indexOf(UNKNOWN) > -1) {
                            sorted[item] = data[item];
                        }
                    } else {
                        sorted[item] = data[item];
                    }
                }
            });

        if (!Object.keys(sorted).length) {
            err = new Error('No packages found in this path...');
        }

        if (excludeLicenses || includeLicenses) {
            if (excludeLicenses) {
                Object.entries(sorted).forEach(([packageName, packageData]) => {
                    let { licenses } = packageData;

                    /*istanbul ignore if - just for protection*/
                    if (!licenses) {
                        filtered[packageName] = packageData;
                    } else {
                        const licensesArr = Array.isArray(licenses) ? licenses : [licenses];
                        const licenseMatch = getLicenseMatch(
                            licensesArr,
                            filtered,
                            packageName,
                            packageData,
                            excludeLicenses,
                        );

                        if (!licenseMatch) {
                            filtered[packageName] = packageData;
                        }
                    }
                });
            }

            if (includeLicenses) {
                Object.entries(sorted).forEach(([packageName, packageData]) => {
                    let { licenses } = packageData;

                    /*istanbul ignore if - just for protection*/
                    if (!licenses) {
                        filtered[packageName] = packageData;
                    } else {
                        const licensesArr = Array.isArray(licenses) ? licenses : [licenses];
                        const licenseMatch = getLicenseMatch(
                            licensesArr,
                            filtered,
                            packageName,
                            packageData,
                            includeLicenses,
                        );

                        if (licenseMatch) {
                            filtered[packageName] = packageData;
                        }
                    }
                });
            }
        } else {
            filtered = { ...sorted };
        }

        let resultJson = { ...filtered };

        // package whitelist
        const whitelist = getOptionArray(args.includePackages);
        if (whitelist) {
            resultJson = onlyIncludeWhitelist(whitelist, resultJson);
        }

        // package blacklist
        const blacklist = getOptionArray(args.excludePackages);
        if (blacklist) {
            resultJson = excludeBlacklist(blacklist, resultJson);
        }

        // exclude by package name starting with a string
        const excludeStartStringsArr = getOptionArray(args.excludePackagesStartingWith);
        if (excludeStartStringsArr) {
            resultJson = excludePackagesStartingWith(excludeStartStringsArr, resultJson);
        }

        if (args.excludePrivatePackages) {
            Object.keys(resultJson).forEach(filterDeletePrivatePackages);
        }

        Object.keys(resultJson).forEach(exitIfCheckHits);

        /*istanbul ignore next*/
        if (err) {
            debugError(err);
            inputError = err;
        }

        // Return the callback and variables nicely
        callback(inputError, resultJson);
    });
};

exports.filterAttributes = function filterAttributes(attributes, json) {
    let filteredJson = json;

    if (attributes) {
        filteredJson = {};
        attributes.forEach((attribute) => {
            filteredJson[attribute] = json[attribute];
        });
    }

    return filteredJson;
};

exports.print = function print(sorted) {
    console.log(exports.asTree(sorted));
};

exports.asTree = function asTree(sorted) {
    return treeify.asTree(sorted, true);
};

exports.asSummary = function asSummary(sorted) {
    const licenseCountMap = new global.Map();
    const licenseCountArray = [];
    const sortedLicenseCountObj = {};

    Object.values(sorted).forEach(({ licenses }) => {
        /*istanbul ignore else*/
        if (licenses) {
            licenseCountMap.set(licenses, licenseCountMap.get(licenses) + 1 || 1);
        }
    });

    licenseCountMap.forEach((count, license) => {
        licenseCountArray.push({ license, count });
    });

    /*istanbul ignore next*/
    licenseCountArray
        .sort((a, b) => b.count - a.count)
        .forEach(({ license, count }) => {
            sortedLicenseCountObj[license] = count;
        });

    return treeify.asTree(sortedLicenseCountObj, true);
};

exports.asCSV = function asCSV(sorted, customFormat, csvComponentPrefix) {
    const csvHeaders = getCsvHeaders(customFormat, csvComponentPrefix);
    const csvDataArr = getCsvData(sorted, customFormat, csvComponentPrefix);

    return [csvHeaders, ...csvDataArr].join('\n');
};

/**
 * Exports data as markdown (*.md) file which has it's own syntax.
 * @method
 * @param  {JSON} sorted       The sorted JSON data from all packages.
 * @param  {JSON} customFormat The custom format with information about the needed keys.
 * @return {String}            The returning plain text.
 */
exports.asMarkDown = function asMarkDown(sorted, customFormat) {
    let text = [];

    if (customFormat && Object.keys(customFormat).length > 0) {
        Object.keys(sorted).forEach((sortedItem) => {
            text.push(`- **[${sortedItem}](${sorted[sortedItem].repository})**`);

            Object.keys(customFormat).forEach((customItem) => {
                text.push(`    - ${customItem}: ${sorted[sortedItem][customItem]}`);
            });
        });
    } else {
        Object.keys(sorted).forEach((key) => {
            const module = sorted[key];
            text.push(`- [${key}](${module.repository}) - ${module.licenses}`);
        });
    }

    return text.join('\n');
};

/**
 * Output data in plain vertical format like Angular CLI does: https://angular.io/3rdpartylicenses.txt
 */
exports.asPlainVertical = function asPlainVertical(sorted) {
    return Object.entries(sorted)
        .map(([moduleName, moduleData]) => {
            let licenseText =
                moduleName.substring(0, moduleName.lastIndexOf('@')) +
                ' ' +
                moduleName.substring(moduleName.lastIndexOf('@') + 1) +
                '\n';

            if (Array.isArray(moduleData.licenses) && moduleData.licenses.length > 0) {
                licenseText += moduleData.licenses.map((moduleLicense) => {
                    /*istanbul ignore else*/
                    if (typeof moduleLicense === 'object') {
                        /*istanbul ignore next*/
                        return moduleLicense.type || moduleLicense.name;
                    }

                    /*istanbul ignore next*/
                    if (typeof moduleLicense === 'string') {
                        return moduleLicense;
                    }
                });
            } else if (
                typeof moduleData.licenses === 'object' &&
                (moduleData.licenses.type || moduleData.licenses.name)
            ) {
                licenseText += getLicenseTitle(moduleData.licenses.type || moduleData.licenses.name);
            } else if (typeof moduleData.licenses === 'string') {
                licenseText += getLicenseTitle(moduleData.licenses);
            }

            licenseText += '\n';

            if (Array.isArray(moduleData.licenseFile) && moduleData.licenseFile.length > 0) {
                licenseText += moduleData.licenseFile.map((moduleLicense) => {
                    /*istanbul ignore else*/
                    if (typeof moduleLicense === 'object') {
                        /*istanbul ignore next*/
                        return moduleLicense.type || moduleLicense.name;
                    }

                    if (typeof moduleLicense === 'string') {
                        return moduleLicense;
                    }
                });
            } else if (
                typeof moduleData.licenseFile === 'object' &&
                (moduleData.licenseFile.type || moduleData.licenseFile.name)
            ) {
                licenseText += moduleData.licenseFile.type || moduleData.licenseFile.name;
            } else if (typeof moduleData.licenseFile === 'string') {
                licenseText += fs.readFileSync(moduleData.licenseFile, { encoding: 'utf8' });
            }

            return licenseText;
        })
        .join('\n\n');
};

exports.parseJson = function parseJson(jsonPath) {
    if (typeof jsonPath !== 'string') {
        return new Error('The path was not specified for the JSON file to parse.');
    }

    try {
        const jsonFileContents = fs.readFileSync(jsonPath, { encoding: 'utf8' });

        return JSON.parse(jsonFileContents);
    } catch (err) {
        return err;
    }
};

exports.asFiles = function asFiles(json, outDir) {
    mkdirp.sync(outDir);

    Object.keys(json).forEach((moduleName) => {
        const licenseFile = json[moduleName].licenseFile;

        if (licenseFile && fs.existsSync(licenseFile)) {
            const fileContents = fs.readFileSync(licenseFile);
            const outPath = path.join(outDir, `${moduleName}-LICENSE.txt`);
            const baseDir = path.dirname(outPath);

            mkdirp.sync(baseDir);
            fs.writeFileSync(outPath, fileContents, 'utf8');
        } else {
            console.warn(`No license file found for module '${moduleName}'`);
        }
    });
};

function getCsvHeaders(customFormat, csvComponentPrefix) {
    const prefixName = '"component"';
    const entriesArr = [];

    if (csvComponentPrefix) {
        entriesArr.push(prefixName);
    }

    if (customFormat && Object.keys(customFormat).length > 0) {
        entriesArr.push('"module name"');

        Object.keys(customFormat).forEach((item) => {
            entriesArr.push(`"${item}"`);
        });
    } else {
        ['"module name"', '"license"', '"repository"'].forEach((item) => {
            entriesArr.push(item);
        });
    }

    return entriesArr.join(',');
}

function getCsvData(sorted, customFormat, csvComponentPrefix) {
    const csvDataArr = [];

    Object.entries(sorted).forEach(([key, module]) => {
        const dataElements = [];

        if (csvComponentPrefix) {
            dataElements.push(`"${csvComponentPrefix}"`);
        }

        //Grab the custom keys from the custom format
        if (customFormat && Object.keys(customFormat).length > 0) {
            dataElements.push(`"${key}"`);

            Object.keys(customFormat).forEach((item) => {
                dataElements.push(`"${module[item]}"`);
            });
        } else {
            dataElements.push([`"${key}"`, `"${module.licenses || ''}"`, `"${module.repository || ''}"`]);
        }

        csvDataArr.push(dataElements.join(','));
    });

    return csvDataArr;
}

function getOptionArray(option) {
    return (Array.isArray(option) && option) || (typeof option === 'string' && option.split(';')) || false;
}
