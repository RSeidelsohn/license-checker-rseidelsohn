import assert from 'assert';
import util from 'util';
import { getLicenseTitle } from '../lib/getLicenseTitle.js';

describe('license parser', () => {
    it('should export a function', () => {
        assert.equal(typeof getLicenseTitle, 'function');
    });

    it('should throw an error when called with a non-string argument', done => {
        try {
            getLicenseTitle({});
        } catch (err) {
            assert.ok(util.isError(err));
            done();
        }
    });

    it('removes newlines from the argument', () => {
        assert.equal(getLicenseTitle('unde\nfined'), 'Undefined');
    });

    it('undefined check', () => {
        assert.equal(getLicenseTitle(undefined), 'Undefined');
    });

    it('MIT check', () => {
        const data = getLicenseTitle('asdf\nasdf\nasdf\nPermission is hereby granted, free of charge, to any');
        assert.equal(data, 'MIT*');
    });

    it('MIT word check', () => {
        const data = getLicenseTitle('asdf\nasdf\nMIT\nasdf\n');
        assert.equal(data, 'MIT*');
    });

    it('Non-MIT word check', () => {
        const data = getLicenseTitle('prefixMIT\n');
        assert.notEqual(data, 'MIT*');
    });

    it('GPL word check', () => {
        let data;
        data = getLicenseTitle('GNU GENERAL PUBLIC LICENSE \nVersion 1, February 1989');
        assert.equal(data, 'GPL-1.0*');
        data = getLicenseTitle('GNU GENERAL PUBLIC LICENSE \nVersion 2, June 1991');
        assert.equal(data, 'GPL-2.0*');
        data = getLicenseTitle('GNU GENERAL PUBLIC LICENSE \nVersion 3, 29 June 2007');
        assert.equal(data, 'GPL-3.0*');
    });

    it('Non-GPL word check', () => {
        let data;
        data = getLicenseTitle('preGNU GENERAL PUBLIC LICENSE \nVersion 1, February 1989');
        assert.notEqual(data, 'GPL-1.0*');
        data = getLicenseTitle('preGNU GENERAL PUBLIC LICENSE \nVersion 2, June 1991');
        assert.notEqual(data, 'GPL-2.0*');
        data = getLicenseTitle('preGNU GENERAL PUBLIC LICENSE \nVersion 3, 29 June 2007');
        assert.notEqual(data, 'GPL-3.0*');
    });

    it('LGPL word check', () => {
        let data;
        data = getLicenseTitle('GNU LIBRARY GENERAL PUBLIC LICENSE\nVersion 2, June 1991');
        assert.equal(data, 'LGPL-2.0*');
        data = getLicenseTitle('GNU LESSER GENERAL PUBLIC LICENSE\nVersion 2.1, February 1999');
        assert.equal(data, 'LGPL-2.1*');
        data = getLicenseTitle('GNU LESSER GENERAL PUBLIC LICENSE \nVersion 3, 29 June 2007');
        assert.equal(data, 'LGPL-3.0*');
    });

    it('BSD check', () => {
        const data = getLicenseTitle(
            'asdf\nRedistribution and use in source and binary forms, with or without\nasdf\n'
        );
        assert.equal(data, 'BSD*');
    });

    it('BSD-Source-Code check', () => {
        const data = getLicenseTitle(
            'asdf\nRedistribution and use of this software in source and binary forms, with or without modification, are permitted provided that the following conditions are met:\nasdf\n'
        );
        assert.equal(data, 'BSD-Source-Code*');
    });

    it('BSD word check', () => {
        const data = getLicenseTitle('asdf\nasdf\nBSD\nasdf\n');
        assert.equal(data, 'BSD*');
    });

    it('Non-BSD word check', () => {
        const data = getLicenseTitle('prefixBSD\n');
        assert.notEqual(data, 'BSD*');
    });

    it('Apache version check', () => {
        const data = getLicenseTitle('asdf\nasdf\nApache License Version 2\nasdf\n');
        assert.equal(data, 'Apache-2.0*');
    });

    it('Apache word check', () => {
        const data = getLicenseTitle('asdf\nasdf\nApache License\nasdf\n');
        assert.equal(data, 'Apache*');
    });

    it('Non-Apache word check', () => {
        const data = getLicenseTitle('prefixApache License\n');
        assert.notEqual(data, 'Apache*');
    });

    it('WTF check', () => {
        const data = getLicenseTitle('DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE');
        assert.equal(data, 'WTFPL*');
    });

    it('WTF word check', () => {
        const data = getLicenseTitle('asdf\nasdf\nWTFPL\nasdf\n');
        assert.equal(data, 'WTFPL*');
    });

    it('Non-WTF word check', () => {
        const data = getLicenseTitle('prefixWTFPL\n');
        assert.notEqual(data, 'WTFPL*');
    });

    it('ISC check', () => {
        const data = getLicenseTitle('asdfasdf\nThe ISC License\nasdfasdf');
        assert.equal(data, 'ISC*');
    });

    it('Non-ISC word check', () => {
        const data = getLicenseTitle('prefixISC\n');
        assert.notEqual(data, 'ISC*');
    });

    it('ISC word check', () => {
        const data = getLicenseTitle('asdf\nasdf\nISC\nasdf\n');
        assert.equal(data, 'ISC*');
    });

    it('CC0-1.0 word check', () => {
        const data = getLicenseTitle(
            'The person who associated a work with this deed has dedicated the work to the public domain by waiving all of his or her rights to the work worldwide under copyright law, including all related and neighboring rights, to the extent allowed by law.\n\nYou can copy, modify, distribute and perform the work, even for commercial purposes, all without asking permission.\n'
        );
        assert.equal(data, 'CC0-1.0*');
    });

    it('Public Domain check', () => {
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

    it('License at URL check', () => {
        let data = getLicenseTitle('License: http://example.com/foo');
        assert.equal(data, 'Custom: http://example.com/foo');
        data = getLicenseTitle('See license at http://example.com/foo');
        assert.equal(data, 'Custom: http://example.com/foo');
        data = getLicenseTitle('license: https://example.com/foo');
        assert.equal(data, 'Custom: https://example.com/foo');
    });

    it('Likely not a license at URL check', () => {
        let data = getLicenseTitle('http://example.com/foo');
        assert.equal(data, null);
        data = getLicenseTitle('See at http://example.com/foo');
        assert.equal(data, null);
    });

    it('License at file check', () => {
        let data = getLicenseTitle('See license in LICENSE.md');
        assert.equal(data, 'Custom: LICENSE.md');
        data = getLicenseTitle('SEE LICENSE IN LICENSE.md');
        assert.equal(data, 'Custom: LICENSE.md');
    });

    it('Check for null', () => {
        const data = getLicenseTitle('this is empty, hi');
        assert.equal(data, null);
    });

    describe('SPDX licenses', () => {
        it('should parse a basic SPDX license', () => {
            var data = ['MIT', 'LGPL-2.0', 'Apache-2.0', 'BSD-2-Clause'];
            data.forEach(licenseType => {
                assert.equal(getLicenseTitle(licenseType), licenseType);
            });
        });

        it('should parse more complicated license expressions', () => {
            var data = [
                '(GPL-2.0+ WITH Bison-exception-2.2)',
                'LGPL-2.0 OR (ISC AND BSD-3-Clause+)',
                'Apache-2.0 OR ISC OR MIT',
            ];
            data.forEach(licenseType => {
                assert.equal(getLicenseTitle(licenseType), licenseType);
            });
        });
    });
});
