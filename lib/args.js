/*
Copyright (c) 2013, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://yuilibrary.com/license/
*/

import nopt from 'nopt';
import chalk from 'chalk';
import path from 'node:path';

const knownOptions = {
    angularCli: Boolean,
    clarificationsFile: path,
    clarificationsMatchAll: Boolean,
    color: Boolean,
    csv: Boolean,
    csvComponentPrefix: String,
    customFormat: {},
    customPath: path,
    depth: Number, // Meant to replace the misleading "--direct" option
    development: Boolean,
    direct: [String, null],
    excludeLicenses: String,
    excludePackages: String,
    excludePackagesStartingWith: String,
    excludePrivatePackages: Boolean,
    failOn: String,
    files: path,
    help: Boolean,
    includeLicenses: String,
    includePackages: String,
    json: Boolean,
    limitAttributes: String,
    markdown: Boolean,
    nopeer: Boolean,
    onlyAllow: String,
    onlyunknownOpts: Boolean,
    out: path,
    plainVertical: Boolean,
    production: Boolean,
    relativeLicensePath: Boolean,
    relativeModulePath: Boolean,
    start: String,
    summary: Boolean,
    unknownOpts: Boolean,
    version: Boolean,
};
const shortHands = {
    h: ['--help'],
    v: ['--version'],
};

const getParsedArguments = function getParsedArguments(args) {
    // nopt returns an object looking like this, if you pass the params '--one --two here there -- --three --four':
    //
    // parsed {
    //   one: true,
    //   two: true,
    //   argv: {
    //     remain: [ 'here', 'there', '--three', '--four' ],
    //     cooked: [ '--one', '--two', 'here', 'there', '--', '--three', '--four' ], // contains the expanded shorthand options
    //     original: [ '--one', '--two', 'here', 'there', '--', '--three', '--four' ]
    //   }
    // }
    const parsed = nopt(knownOptions, shortHands, args || process.argv);

    delete parsed.argv;

    return parsed;
};

/**
 * Converts a value for the "--direct" option into a number. The "--direct"
 * option is meant to accept either a Boolen or a Number. Either of those
 * values will then be taken for determining the depth:
 * - Passing in no value or leaving the parameter off will be interpreted as Infinity
 * - Passing in true will be interpreted as Infinity
 * - Passing in false will be interpreted as 0
 * - Passing in a number will be interpreted as that number
 * - Passing in any other value that can't be recognized as a number will be interpreted as Infinity
 *
 * @param {*} value
 * @returns Number
 */
const convertToNumberOfDepth = function convertToNumber(value = Infinity) {
    let numberValue = 0;

    /* eslint-disable indent */
    switch (typeof value) {
        case 'string':
            numberValue = value.toLowerCase();

            if (numberValue === 'true') {
                numberValue = Infinity;
            } else if (numberValue === 'false') {
                numberValue = 0;
            } else {
                numberValue = Number(numberValue, 10);

                if (Number.isNaN(numberValue)) {
                    numberValue = Infinity;
                } else {
                    numberValue = Math.max(0, numberValue);
                }
            }
            break;
        case 'boolean':
            numberValue = value ? Infinity : 0;
            break;
        case 'number':
            numberValue = Math.max(0, value);
            break;
        default:
            numberValue = Infinity;
    }
    /* eslint-enable indent */

    return numberValue;
};

const setDefaults = function setDefaults(parsed = {}) {
    /*istanbul ignore else*/
    if (parsed.color == null) {
        parsed.color = chalk.supportsColor;
    }

    if (parsed.json || parsed.markdown || parsed.csv) {
        parsed.color = false;
    }

    parsed.start = parsed.start || process.cwd();
    parsed.relativeLicensePath = Boolean(parsed.relativeLicensePath);
    parsed.relativeModulePath = Boolean(parsed.relativeModulePath);
    parsed.direct = convertToNumberOfDepth(parsed.direct);

    // "--depth" should replace "--direct", as it is better understandable:
    if (parsed.depth !== null && parsed.depth !== undefined) {
        parsed.direct = Number(parsed.depth);
    }

    return parsed;
};

const parse = function parse(args) {
    return setDefaults(getParsedArguments(args));
};

export { knownOptions, parse, setDefaults, getParsedArguments };
