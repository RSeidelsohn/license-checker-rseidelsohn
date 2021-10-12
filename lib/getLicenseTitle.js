const spdxExpressionParse = require('spdx-expression-parse');

const MIT_LICENSE = /ermission is hereby granted, free of charge, to any/;
const BSD_LICENSE = /edistribution and use in source and binary forms, with or withou/;
const BSD_SOURCE_CODE_LICENSE = /edistribution and use of this software in source and binary forms, with or withou/;
const WTFPL_LICENSE = /DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE/;
const ISC_LICENSE = /The ISC License/;
const MIT = /\bMIT\b/;
const BSD = /\bBSD\b/;
const ISC = /\bISC\b/;
const GPL = /\bGNU GENERAL PUBLIC LICENSE\s*Version ([^,]*)/i;
const LGPL = /(?:LESSER|LIBRARY) GENERAL PUBLIC LICENSE\s*Version ([^,]*)/i;
const APACHE_VERSION = /\bApache License\s*Version ([^,\s]*)/i;
const APACHE = /\bApache License\b/;
const WTFPL = /\bWTFPL\b/;
const ZERO_PARITY_LICENSE = /\bParity\b/;
// https://creativecommons.org/publicdomain/zero/1.0/
const CC0_1_0 =
    /The\s+person\s+who\s+associated\s+a\s+work\s+with\s+this\s+deed\s+has\s+dedicated\s+the\s+work\s+to\s+the\s+public\s+domain\s+by\s+waiving\s+all\s+of\s+his\s+or\s+her\s+rights\s+to\s+the\s+work\s+worldwide\s+under\s+copyright\s+law,\s+including\s+all\s+related\s+and\s+neighboring\s+rights,\s+to\s+the\s+extent\s+allowed\s+by\s+law.\s+You\s+can\s+copy,\s+modify,\s+distribute\s+and\s+perform\s+the\s+work,\s+even\s+for\s+commercial\s+purposes,\s+all\s+without\s+asking\s+permission./i; // jshint ignore:line
const PUBLIC_DOMAIN = /[Pp]ublic[\-_ ]*[Dd]omain/;
const IS_URL = /(https?:\/\/[-a-zA-Z0-9\/.]*)/;
const IS_FILE_REFERENCE = /SEE LICENSE IN (.*)/i;
const UNLICENSED = /UNLICENSED/i;

module.exports = function getLicenseTitle(str = 'undefined') {
    if (typeof str !== 'string') {
        throw new Error(
            `Wrong type for parameter "str" ("${str}"): Must be of type string`,
            'lib/getLicenseTitle.js',
            24,
        );
    }

    let match;
    let version;

    try {
        spdxExpressionParse(str || '');
        return str;
    } catch (error) {
        // Fail silently and continue
    }

    if (str) {
        str = str.replace('\n', '');
    }

    if (typeof str === 'undefined' || !str || str === 'undefined') {
        return 'Undefined';
    }

    if (ZERO_PARITY_LICENSE.test(str)) {
        return 'Zero Parity*';
    }

    if (ISC_LICENSE.test(str)) {
        return 'ISC*';
    }

    if (MIT_LICENSE.test(str)) {
        return 'MIT*';
    }

    if (BSD_LICENSE.test(str)) {
        return 'BSD*';
    }

    if (BSD_SOURCE_CODE_LICENSE.test(str)) {
        // https://spdx.org/licenses/BSD-Source-Code.html
        return 'BSD-Source-Code*';
    }

    if (WTFPL_LICENSE.test(str)) {
        return 'WTFPL*';
    }

    if (ISC.test(str)) {
        return 'ISC*';
    }

    if (MIT.test(str)) {
        return 'MIT*';
    }

    if (BSD.test(str)) {
        return 'BSD*';
    }

    if (WTFPL.test(str)) {
        return 'WTFPL*';
    }

    if (APACHE_VERSION.test(str)) {
        match = APACHE_VERSION.exec(str);
        version = match[1];

        if (version.length === 1) {
            version = version + '.0';
        }

        return 'Apache-' + version + '*';
    }

    if (APACHE.test(str)) {
        return 'Apache*';
    }

    if (CC0_1_0.test(str)) {
        return 'CC0-1.0*';
    }

    if (GPL.test(str)) {
        match = GPL.exec(str);
        version = match[1];

        /*istanbul ignore else*/
        if (version.length === 1) {
            version = version + '.0';
        }

        return 'GPL-' + version + '*';
    }

    if (LGPL.test(str)) {
        match = LGPL.exec(str);
        version = match[1];

        if (version.length === 1) {
            version = version + '.0';
        }
        return 'LGPL-' + version + '*';
    }

    if (PUBLIC_DOMAIN.test(str)) {
        return 'Public Domain';
    }

    if (UNLICENSED.test(str)) {
        return 'UNLICENSED';
    }

    match = IS_URL.exec(str) || IS_FILE_REFERENCE.exec(str);

    if (match) {
        return 'Custom: ' + match[1];
    } else {
        return null;
    }
};
