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
const getLicenseTitle = require('./getLicenseTitle');
const licenseFiles = require('./license-files');
const mkdirp = require('mkdirp');
const path = require('path');
const read = require('read-installed-packages');
const spdxCorrect = require('spdx-correct');
const spdxSatisfies = require('spdx-satisfies');
const treeify = require('treeify');

// Set up debug logging
// https://www.npmjs.com/package/debug#stderr-vs-stdout
const debugError = debug('license-checker-rseidelsohn:error');
const debugLog = debug('license-checker-rseidelsohn:log');

debugLog.log = console.log.bind(console);

const flatten = function flatten(options) {
    const moduleInfo = { licenses: UNKNOWN };
    const { color: colorize, deps: json, unknown } = options;
    const key = `${json.name}@${json.version}`;
    let dirFiles;
    let files = [];
    let licenseData;
    let licenseFile;
    let noticeFiles = [];
    let readmeFile;
    let { data } = options;

    if (json.private) {
        moduleInfo.private = true;
    }

    // If we have processed this key already, just return the data object.
    // This was added so that we don't recurse forever if there was a circular
    // dependency in the dependency tree.
    /*istanbul ignore next*/
    if (data[key]) {
        return data;
    }

    if ((options.production && json.extraneous) || (options.development && !json.extraneous && !json.root)) {
        return data;
    }

    data[key] = moduleInfo;

    // Include property in output unless custom format has set property to false.
    function mustInclude(property) {
        return options?.customFormat?.[property] !== false;
    }

    if (mustInclude('repository') && json.repository) {
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

    if (mustInclude('url') && json?.url?.we) {
        /*istanbul ignore next*/
        moduleInfo.url = json.url.web;
    }

    if (json.author && typeof json.author === 'object') {
        /*istanbul ignore else - This should always be there*/
        if (mustInclude('publisher') && json.author.name) {
            moduleInfo.publisher = json.author.name;
        }

        if (mustInclude('email') && json.author.email) {
            moduleInfo.email = json.author.email;
        }

        if (mustInclude('url') && json.author.url) {
            moduleInfo.url = json.author.url;
        }
    }

    /*istanbul ignore next*/
    if (unknown) {
        moduleInfo.dependencyPath = json.path;
    }

    if (mustInclude('path') && typeof json?.path === 'string') {
        moduleInfo.path = json.path;
    }

    licenseData = json.license || json.licenses || undefined;

    if (json.path && (!json.readme || json.readme.toLowerCase().indexOf('no readme data found') > -1)) {
        readmeFile = path.join(json.path, 'README.md');
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
    if (fs.existsSync(json?.path)) {
        dirFiles = fs.readdirSync(json.path);
        files = licenseFiles(dirFiles);

        noticeFiles = dirFiles.filter((filename) => {
            filename = filename.toUpperCase();
            const name = path.basename(filename).replace(path.extname(filename), '');

            return name === 'NOTICE';
        });
    }

    files.forEach(function (filename, index) {
        licenseFile = path.join(json.path, filename);
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
                /*istanbul ignore else*/
                if (mustInclude('licenseFile')) {
                    moduleInfo.licenseFile = options.basePath
                        ? path.relative(options.basePath, licenseFile)
                        : licenseFile;
                }

                if (mustInclude('licenseText') && options.customFormat) {
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

                if (mustInclude('copyright') && options.customFormat) {
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
    });

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
            const childDependency = json.dependencies[name];
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
            });
        });
    }

    if (!json.name || !json.version) {
        delete data[key];
    }

    /*istanbul ignore next*/
    if (options.customFormat) {
        Object.keys(options.customFormat).forEach((item) => {
            if (mustInclude(item) && moduleInfo[item] == null) {
                moduleInfo[item] = typeof json[item] === 'string' ? json[item] : options.customFormat[item];
            }
        });
    }

    return data;
};

exports.init = function init(args, callback) {
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

        function exitIfCheckHits(packageName) {
            const currentLicense = resultJson[packageName].licenses;

            checkForFailOn(currentLicense);
            checkForOnlyAllow(currentLicense, packageName);
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
            resultJson = onlyIncludeWhitelist(whitelist, filtered);
        }

        // package blacklist
        const blacklist = getOptionArray(args.excludePackages);
        if (blacklist) {
            resultJson = excludeBlacklist(blacklist, filtered);
        }

        if (args.excludePrivatePackages) {
            Object.keys(filtered).forEach(filterDeletePrivatePackages);
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
            text.push(` - **[${sortedItem}](${sorted[sortedItem].repository})**`);

            Object.keys(customFormat).forEach((customItem) => {
                text.push(`    - ${customItem}: ${sorted[sortedItem][customItem]}`);
            });
        });
    } else {
        Object.keys(sorted).forEach((key) => {
            const module = sorted[key];
            text.push(`[${key}](${module.repository}) - ${module.licenses}`);
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
