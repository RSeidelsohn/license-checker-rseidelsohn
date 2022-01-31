/*
Copyright (c) 2013, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://yuilibrary.com/license/
*/

const nopt = require('nopt');
const chalk = require('chalk');
const knownOpts = {
    angularCli: Boolean,
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
    includePackages: String,
    json: Boolean,
    markdown: Boolean,
    nopeer: Boolean,
    onlyAllow: String,
    onlyunknownOpts: Boolean,
    out: require('path'),
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

const getParsedArgs = function getParsedArgs(args) {
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
    const parsed = nopt(knownOpts, shortHands, args || process.argv);

    delete parsed.argv;

    return parsed;
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

    if (parsed.direct) {
        parsed.direct = 0;
    } else {
        parsed.direct = Infinity;
    }

    return parsed;
};

const parse = function parse(args) {
    return setDefaults(getParsedArgs(args));
};

module.exports = {
    knownOpts: knownOpts,
    parse: parse,
    setDefaults: setDefaults,
};
