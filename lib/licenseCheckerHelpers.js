import chalk from 'chalk';
import cloneDeep from 'lodash.clonedeep';
import fs from 'node:fs';
import path from 'node:path';

import * as licenseChecker from './index.js';

const shouldColorizeOutput = function shouldColorizeOutput(args) {
    return args.color && !args.out && !args.files && !(args.csv || args.json || args.markdown || args.plainVertical);
};

const colorizeOutput = function colorizeOutput(json) {
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

const filterJson = function filterJson(limitAttributes, json) {
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

const getFormattedOutput = function getFormattedOutput(modulesWithVersions, args) {
    let filteredJson = filterJson(args.limitAttributes, modulesWithVersions);
    const jsonCopy = cloneDeep(filteredJson);
    filteredJson = null;

    if (args.files) {
        Object.keys(jsonCopy).forEach((moduleName) => {
            const outPath = path.join(args.files, `${moduleName}-LICENSE.txt`);
            const originalLicenseFile = jsonCopy[moduleName].licenseFile;

            if (originalLicenseFile && fs.existsSync(originalLicenseFile)) {
                if (args.relativeLicensePath) {
                    if (args.out) {
                        jsonCopy[moduleName].licenseFile = path.relative(path.dirname(args.out), outPath);
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

export { colorizeOutput, getFormattedOutput, shouldColorizeOutput };
