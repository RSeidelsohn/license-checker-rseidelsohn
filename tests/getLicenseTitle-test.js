import { describe, expect, it } from 'vitest';
import { getLicenseTitle } from '../lib/getLicenseTitle.js';

describe('license parser', () => {
	it('should export a function', () => {
		expect(getLicenseTitle).toBeTypeOf('function');
	});

	it('should throw an error when called with a non-string argument', () => {
		expect(() => getLicenseTitle({})).toThrow(/Must be of type string/);
	});

	it('removes newlines from the argument', () => {
		expect(getLicenseTitle('unde\nfined')).toBe('Undefined');
	});

	it('undefined check', () => {
		expect(getLicenseTitle(undefined)).toBe('Undefined');
	});

	it('MIT check', () => {
		const data = getLicenseTitle('asdf\nasdf\nasdf\nPermission is hereby granted, free of charge, to any');
		expect(data).toBe('MIT*');
	});

	it('MIT word check', () => {
		const data = getLicenseTitle('asdf\nasdf\nMIT\nasdf\n');
		expect(data).toBe('MIT*');
	});

	it('Non-MIT word check', () => {
		const data = getLicenseTitle('prefixMIT\n');
		expect(data).not.toBe('MIT*');
	});

	it('GPL word check', () => {
		expect(getLicenseTitle('GNU GENERAL PUBLIC LICENSE \nVersion 1, February 1989')).toBe('GPL-1.0*');
		expect(getLicenseTitle('GNU GENERAL PUBLIC LICENSE \nVersion 2, June 1991')).toBe('GPL-2.0*');
		expect(getLicenseTitle('GNU GENERAL PUBLIC LICENSE \nVersion 3, 29 June 2007')).toBe('GPL-3.0*');
	});

	it('Non-GPL word check', () => {
		expect(getLicenseTitle('preGNU GENERAL PUBLIC LICENSE \nVersion 1, February 1989')).not.toBe('GPL-1.0*');
		expect(getLicenseTitle('preGNU GENERAL PUBLIC LICENSE \nVersion 2, June 1991')).not.toBe('GPL-2.0*');
		expect(getLicenseTitle('preGNU GENERAL PUBLIC LICENSE \nVersion 3, 29 June 2007')).not.toBe('GPL-3.0*');
	});

	it('LGPL word check', () => {
		expect(getLicenseTitle('GNU LIBRARY GENERAL PUBLIC LICENSE\nVersion 2, June 1991')).toBe('LGPL-2.0*');
		expect(getLicenseTitle('GNU LESSER GENERAL PUBLIC LICENSE\nVersion 2.1, February 1999')).toBe('LGPL-2.1*');
		expect(getLicenseTitle('GNU LESSER GENERAL PUBLIC LICENSE \nVersion 3, 29 June 2007')).toBe('LGPL-3.0*');
	});

	it('BSD check', () => {
		expect(getLicenseTitle('asdf\nRedistribution and use in source and binary forms, with or without\nasdf\n')).toBe(
			'BSD*'
		);
	});

	it('BSD-Source-Code check', () => {
		expect(
			getLicenseTitle(
				'asdf\nRedistribution and use of this software in source and binary forms, with or without modification, are permitted provided that the following conditions are met:\nasdf\n'
			)
		).toBe('BSD-Source-Code*');
	});

	it('BSD word check', () => {
		expect(getLicenseTitle('asdf\nasdf\nBSD\nasdf\n')).toBe('BSD*');
	});

	it('Non-BSD word check', () => {
		expect(getLicenseTitle('prefixBSD\n')).not.toBe('BSD*');
	});

	it('Apache version check', () => {
		expect(getLicenseTitle('asdf\nasdf\nApache License Version 2\nasdf\n')).toBe('Apache-2.0*');
	});

	it('Apache word check', () => {
		expect(getLicenseTitle('asdf\nasdf\nApache License\nasdf\n')).toBe('Apache*');
	});

	it('Non-Apache word check', () => {
		expect(getLicenseTitle('prefixApache License\n')).not.toBe('Apache*');
	});

	it('WTF check', () => {
		expect(getLicenseTitle('DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE')).toBe('WTFPL*');
	});

	it('WTF word check', () => {
		expect(getLicenseTitle('asdf\nasdf\nWTFPL\nasdf\n')).toBe('WTFPL*');
	});

	it('Non-WTF word check', () => {
		expect(getLicenseTitle('prefixWTFPL\n')).not.toBe('WTFPL*');
	});

	it('ISC check', () => {
		expect(getLicenseTitle('asdfasdf\nThe ISC License\nasdfasdf')).toBe('ISC*');
	});

	it('Non-ISC word check', () => {
		expect(getLicenseTitle('prefixISC\n')).not.toBe('ISC*');
	});

	it('ISC word check', () => {
		expect(getLicenseTitle('asdf\nasdf\nISC\nasdf\n')).toBe('ISC*');
	});

	it('CC0-1.0 word check', () => {
		expect(
			getLicenseTitle(
				'The person who associated a work with this deed has dedicated the work to the public domain by waiving all of his or her rights to the work worldwide under copyright law, including all related and neighboring rights, to the extent allowed by law.\n\nYou can copy, modify, distribute and perform the work, even for commercial purposes, all without asking permission.\n'
			)
		).toBe('CC0-1.0*');
	});

	it('Public Domain check', () => {
		expect(getLicenseTitle('Public Domain')).toBe('Public Domain');
		expect(getLicenseTitle('public domain')).toBe('Public Domain');
		expect(getLicenseTitle('Public domain')).toBe('Public Domain');
		expect(getLicenseTitle('Public-Domain')).toBe('Public Domain');
		expect(getLicenseTitle('Public_Domain')).toBe('Public Domain');
	});

	it('License at URL check', () => {
		expect(getLicenseTitle('License: http://example.com/foo')).toBe('Custom: http://example.com/foo');
		expect(getLicenseTitle('See license at http://example.com/foo')).toBe('Custom: http://example.com/foo');
		expect(getLicenseTitle('license: https://example.com/foo')).toBe('Custom: https://example.com/foo');
	});

	it('Likely not a license at URL check', () => {
		expect(getLicenseTitle('http://example.com/foo')).toBeNull();
		expect(getLicenseTitle('See at http://example.com/foo')).toBeNull();
	});

	it('License at file check', () => {
		expect(getLicenseTitle('See license in LICENSE.md')).toBe('Custom: LICENSE.md');
		expect(getLicenseTitle('SEE LICENSE IN LICENSE.md')).toBe('Custom: LICENSE.md');
	});

	it('Check for null', () => {
		expect(getLicenseTitle('this is empty, hi')).toBeNull();
	});

	describe('SPDX licenses', () => {
		it.each(['MIT', 'LGPL-2.0', 'Apache-2.0', 'BSD-2-Clause'])('should parse basic SPDX license %s', licenseType => {
			expect(getLicenseTitle(licenseType)).toBe(licenseType);
		});

		it.each([
			'(GPL-2.0+ WITH Bison-exception-2.2)',
			'LGPL-2.0 OR (ISC AND BSD-3-Clause+)',
			'Apache-2.0 OR ISC OR MIT',
		])('should parse more complicated license expression %s', licenseType => {
			expect(getLicenseTitle(licenseType)).toBe(licenseType);
		});
	});
});
