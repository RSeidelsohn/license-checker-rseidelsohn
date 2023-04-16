const assert = require('assert');
const util = require('util');
const getLicenseTitle = require('../lib/getLicenseTitle');

describe('license parser', function () {
    it('should export a function', function () {
        assert.equal(typeof getLicenseTitle, 'function');
    });

    it('should throw an error when called with a non-string argument', function (done) {
        try {
            getLicenseTitle({});
        } catch (err) {
            assert.ok(util.isError(err));
            done();
        }
    });

    it('removes newlines from the argument', function () {
        assert.equal(getLicenseTitle('unde\nfined'), 'Undefined');
    });

    it('undefined check', function () {
        assert.equal(getLicenseTitle(undefined), 'Undefined');
    });

    it('MIT check', function () {
        const data = getLicenseTitle('asdf\nasdf\nasdf\nPermission is hereby granted, free of charge, to any');
        assert.equal(data, 'MIT*');
    });

    it('MIT word check', function () {
        const data = getLicenseTitle('asdf\nasdf\nMIT\nasdf\n');
        assert.equal(data, 'MIT*');
    });

    it('Non-MIT word check', function () {
        const data = getLicenseTitle('prefixMIT\n');
        assert.notEqual(data, 'MIT*');
    });

    it('GPL word check', function () {
        let data;
        data = getLicenseTitle('GNU GENERAL PUBLIC LICENSE \nVersion 1, February 1989');
        assert.equal(data, 'GPL-1.0*');
        data = getLicenseTitle('GNU GENERAL PUBLIC LICENSE \nVersion 2, June 1991');
        assert.equal(data, 'GPL-2.0*');
        data = getLicenseTitle('GNU GENERAL PUBLIC LICENSE \nVersion 3, 29 June 2007');
        assert.equal(data, 'GPL-3.0*');
    });

    it('Non-GPL word check', function () {
        let data;
        data = getLicenseTitle('preGNU GENERAL PUBLIC LICENSE \nVersion 1, February 1989');
        assert.notEqual(data, 'GPL-1.0*');
        data = getLicenseTitle('preGNU GENERAL PUBLIC LICENSE \nVersion 2, June 1991');
        assert.notEqual(data, 'GPL-2.0*');
        data = getLicenseTitle('preGNU GENERAL PUBLIC LICENSE \nVersion 3, 29 June 2007');
        assert.notEqual(data, 'GPL-3.0*');
    });

    it('LGPL word check', function () {
        let data;
        data = getLicenseTitle('GNU LIBRARY GENERAL PUBLIC LICENSE\nVersion 2, June 1991');
        assert.equal(data, 'LGPL-2.0*');
        data = getLicenseTitle('GNU LESSER GENERAL PUBLIC LICENSE\nVersion 2.1, February 1999');
        assert.equal(data, 'LGPL-2.1*');
        data = getLicenseTitle('GNU LESSER GENERAL PUBLIC LICENSE \nVersion 3, 29 June 2007');
        assert.equal(data, 'LGPL-3.0*');
    });

    it('BSD check', function () {
        const data = getLicenseTitle(
            'asdf\nRedistribution and use in source and binary forms, with or without\nasdf\n',
        );
        assert.equal(data, 'BSD*');
    });

    it('BSD-Source-Code check', function () {
        const data = getLicenseTitle(
            'asdf\nRedistribution and use of this software in source and binary forms, with or without modification, are permitted provided that the following conditions are met:\nasdf\n',
        );
        assert.equal(data, 'BSD-Source-Code*');
    });

    it('BSD word check', function () {
        const data = getLicenseTitle('asdf\nasdf\nBSD\nasdf\n');
        assert.equal(data, 'BSD*');
    });

    it('Non-BSD word check', function () {
        const data = getLicenseTitle('prefixBSD\n');
        assert.notEqual(data, 'BSD*');
    });

    it('Apache version check', function () {
        const data = getLicenseTitle('asdf\nasdf\nApache License Version 2\nasdf\n');
        assert.equal(data, 'Apache-2.0*');
    });

    it('Apache word check', function () {
        const data = getLicenseTitle('asdf\nasdf\nApache License\nasdf\n');
        assert.equal(data, 'Apache*');
    });

    it('Non-Apache word check', function () {
        const data = getLicenseTitle('prefixApache License\n');
        assert.notEqual(data, 'Apache*');
    });

    it('WTF check', function () {
        const data = getLicenseTitle('DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE');
        assert.equal(data, 'WTFPL*');
    });

    it('WTF word check', function () {
        const data = getLicenseTitle('asdf\nasdf\nWTFPL\nasdf\n');
        assert.equal(data, 'WTFPL*');
    });

    it('Non-WTF word check', function () {
        const data = getLicenseTitle('prefixWTFPL\n');
        assert.notEqual(data, 'WTFPL*');
    });

    it('ISC check', function () {
        const data = getLicenseTitle('asdfasdf\nThe ISC License\nasdfasdf');
        assert.equal(data, 'ISC*');
    });

    it('Non-ISC word check', function () {
        const data = getLicenseTitle('prefixISC\n');
        assert.notEqual(data, 'ISC*');
    });

    it('ISC word check', function () {
        const data = getLicenseTitle('asdf\nasdf\nISC\nasdf\n');
        assert.equal(data, 'ISC*');
    });

    it('CC0-1.0 word check', function () {
        const data = getLicenseTitle(
            'The person who associated a work with this deed has dedicated the work to the public domain by waiving all of his or her rights to the work worldwide under copyright law, including all related and neighboring rights, to the extent allowed by law.\n\nYou can copy, modify, distribute and perform the work, even for commercial purposes, all without asking permission.\n',
        );
        assert.equal(data, 'CC0-1.0*');
    });

    it('Public Domain check', function () {
        let data = getLicenseTitle('Public Domain');
        assert.equal(data, 'Public Domain');
        data = getLicenseTitle('public domain');
        assert.equal(data, 'Public Domain');
        data = getLicenseTitle('Public domain');
        assert.equal(data, 'Public Domain');
        data = getLicenseTitle('Public-Domain');
        assert.equal(data, 'Public Domain');
        data = getLicenseTitle('Public_Domain');
        assert.equal(data, 'Public Domain');
    });

    it('License at URL check', function () {
        let data = getLicenseTitle('http://example.com/foo');
        assert.equal(data, 'Custom: http://example.com/foo');
        data = getLicenseTitle('See license at http://example.com/foo');
        assert.equal(data, 'Custom: http://example.com/foo');
        data = getLicenseTitle('https://example.com/foo');
        assert.equal(data, 'Custom: https://example.com/foo');
    });

    it('License at file check', function () {
        let data = getLicenseTitle('See license in LICENSE.md');
        assert.equal(data, 'Custom: LICENSE.md');
        data = getLicenseTitle('SEE LICENSE IN LICENSE.md');
        assert.equal(data, 'Custom: LICENSE.md');
    });

    it('Check for null', function () {
        const data = getLicenseTitle('this is empty, hi');
        assert.equal(data, null);
    });

    describe('SPDX licenses', function () {
        it('should parse a basic SPDX license', function () {
            var data = ['MIT', 'LGPL-2.0', 'Apache-2.0', 'BSD-2-Clause'];
            data.forEach(function (licenseType) {
                assert.equal(getLicenseTitle(licenseType), licenseType);
            });
        });

        it('should parse more complicated license expressions', function () {
            var data = [
                '(GPL-2.0+ WITH Bison-exception-2.2)',
                'LGPL-2.0 OR (ISC AND BSD-3-Clause+)',
                'Apache-2.0 OR ISC OR MIT',
            ];
            data.forEach(function (licenseType) {
                assert.equal(getLicenseTitle(licenseType), licenseType);
            });
        });
    });
});
