const chalk = require('chalk');
const cloneDeep = require('lodash.clonedeep');
const licenseChecker = require('../lib/index');
const path = require('path');

const shouldColorizeOutput = (args) =>
    args.color && !args.out && !args.files && !(args.csv || args.json || args.markdown || args.plainVertical);

const colorizeOutput = (json) => {
    Object.keys(json).forEach((key) => {
        const index = key.lastIndexOf('@');
        const colorizedKey =
            chalk.white.bgKeyword('darkslategrey')(key.slice(0, index + 1)) +
            chalk.dim('@') +
            chalk.white.bgKeyword('green')(key.slice(index + 1));
        json[colorizedKey] = json[key];

        delete json[key];
    });
};

const filterJson = (limitAttributes, json) => {
    let filteredJson = json;

    if (limitAttributes) {
        filteredJson = {};
        const attributes = limitAttributes.split(',').map((attribute) => attribute.trim());

        Object.keys(json).forEach((dependency) => {
            filteredJson[dependency] = licenseChecker.filterAttributes(attributes, json[dependency]);
        });
    }

    return filteredJson;
};

const getFormattedOutput = (json, args) => {
    let filteredJson = filterJson(args.limitAttributes, json);
    const jsonCopy = cloneDeep(filteredJson);
    filteredJson = null;

    if (args.files) {
        Object.keys(jsonCopy).forEach((moduleName) => {
            const outPath = path.join(args.files, `${moduleName}-LICENSE.txt`);
            const originalLicenseFile = jsonCopy[moduleName].licenseFile;

            if (originalLicenseFile && fs.existsSync(originalLicenseFile)) {
                if (args.relativeLicensePath) {
                    if (args.out) {
                        jsonCopy[moduleName].licenseFile = path.relative(args.out, outPath);
                    } else {
                        jsonCopy[moduleName].licenseFile = path.relative(process.cwd(), outPath);
                    }
                } else {
                    jsonCopy[moduleName].licenseFile = outPath;
                }
            }
        });
    }

    if (args.json) {
        return JSON.stringify(jsonCopy, null, 4) + '\n';
    }

    if (args.csv) {
        return licenseChecker.asCSV(jsonCopy, args.customFormat, args.csvComponentPrefix);
    }

    if (args.markdown) {
        return licenseChecker.asMarkDown(jsonCopy, args.customFormat) + '\n';
    }

    if (args.summary) {
        return licenseChecker.asSummary(jsonCopy);
    }

    if (args.plainVertical || args.angluarCli) {
        return licenseChecker.asPlainVertical(jsonCopy);
    }

    return licenseChecker.asTree(jsonCopy);
};

/**
 * ! This function has a wanted sideeffect, as it modifies the json object that is passed by reference.
 *
 *  The depth attribute set in the options parameter here - which is defined by setting the `--direct` flag - is of
 *  no use with npm < 3, as the older npm versions flattened all dependencies into one single directory. So in
 *  order to making `--direct` work with older versions of npm, we need to filter out all non-dependencies from
 *  the json result.
 */
// TODO: Add tests for this function
const deleteNonDirectDependenciesFromAllDependencies = (
    { _dependencies: directDependencies, dependencies: allDependencies, devDependencies },
    options,
) => {
    const allDependenciesArray = Object.keys(allDependencies);
    const directDependenciesArray = Object.keys(directDependencies);
    const devDependenciesArray = Object.keys(devDependencies);
    let wantedDependenciesArray = [];

    if (options.production && !options.development) {
        wantedDependenciesArray = directDependenciesArray.filter(
            (directDependency) => !devDependenciesArray.includes(directDependency),
        );
    } else if (!options.production && options.development) {
        wantedDependenciesArray = devDependenciesArray;
    } else {
        wantedDependenciesArray = directDependenciesArray;
    }

    allDependenciesArray.forEach((currentDependency) => {
        if (!wantedDependenciesArray.includes(currentDependency)) {
            delete allDependencies[currentDependency];
        }
    });
};

module.exports = {
    colorizeOutput,
    deleteNonDirectDependenciesFromAllDependencies,
    filterJson,
    getFormattedOutput,
    shouldColorizeOutput,
};
