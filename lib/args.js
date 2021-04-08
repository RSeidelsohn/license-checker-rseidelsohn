/*
Copyright (c) 2013, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://yuilibrary.com/license/
*/

const nopt = require('nopt');
const chalk = require('chalk');
const known = {
    color: Boolean,
    csv: Boolean,
    csvComponentPrefix: String,
    customFormat: {},
    customPath: require('path'),
    development: Boolean,
    direct: Boolean,
    excludeLicenses: String,
    excludePackages: String,
    excludePrivatePackages: Boolean,
    failOn: String,
    files: require('path'),
    help: Boolean,
    includeLicenses: String,
    json: Boolean,
    markdown: Boolean,
    onlyAllow: String,
    onlyunknown: Boolean,
    out: require('path'),
    includePackages: String,
    production: Boolean,
    relativeLicensePath: Boolean,
    relativeModulePath: Boolean,
    start: String,
    summary: Boolean,
    unknown: Boolean,
    version: Boolean,
};
const shorts = {
    v: ['--version'],
    h: ['--help'],
};

const getParsedArgs = function getParsedArgs(args) {
    return nopt(known, shorts, args || process.argv);
};

/*istanbul ignore next */
const has = function has(a) {
    const cooked = getParsedArgs().argv.cooked;
    let ret = false;

    cooked.forEach(function(o) {
        if (o === `--${a}` || o === `--no-${a}`) {
            ret = true;
        }
    });

    return ret;
};

const getCleanParsedArgs = function getCleanParsedArgs(args) {
    const parsed = getParsedArgs(args);

    delete parsed.argv;

    return parsed;
};

const setDefaults = function setDefaults(parsed) {
    if (parsed == null) {
        parsed = getCleanParsedArgs();
    }

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

    if (parsed.direct) {
        parsed.direct = 0;
    } else {
        parsed.direct = Infinity;
    }

    return parsed;
};

const parse = function parse(args) {
    return setDefaults(getCleanParsedArgs(args));
};

exports.defaults = setDefaults;
exports.has = has;
exports.getParsedArgs = getParsedArgs;
exports.parse = parse;
exports.shorts = shorts;
exports.known = known;
