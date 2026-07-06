import { describe, expect, it } from 'vitest';
import { detectLicenseTitle } from '../../lib/licenses/detect-license-title.js';

describe('license parser', () => {
	it('should export a function', () => {
		expect(detectLicenseTitle).toBeTypeOf('function');
	});

	it('should throw an error when called with a non-string argument', () => {
		expect(() => detectLicenseTitle({} as unknown as string)).toThrow(/Must be of type string/);
	});

	it('removes newlines from the argument', () => {
		expect(detectLicenseTitle('unde\nfined')).toBe('Undefined');
	});

	it('undefined check', () => {
		expect(detectLicenseTitle(undefined)).toBe('Undefined');
	});

	it('MIT check', () => {
		const data = detectLicenseTitle('asdf\nasdf\nasdf\nPermission is hereby granted, free of charge, to any');
		expect(data).toBe('MIT*');
	});

	it('MIT word check', () => {
		const data = detectLicenseTitle('asdf\nasdf\nMIT\nasdf\n');
		expect(data).toBe('MIT*');
	});

	it('Non-MIT word check', () => {
		const data = detectLicenseTitle('prefixMIT\n');
		expect(data).not.toBe('MIT*');
	});

	it('GPL word check', () => {
		expect(detectLicenseTitle('GNU GENERAL PUBLIC LICENSE \nVersion 1, February 1989')).toBe('GPL-1.0*');
		expect(detectLicenseTitle('GNU GENERAL PUBLIC LICENSE \nVersion 2, June 1991')).toBe('GPL-2.0*');
		expect(detectLicenseTitle('GNU GENERAL PUBLIC LICENSE \nVersion 3, 29 June 2007')).toBe('GPL-3.0*');
	});

	it('Non-GPL word check', () => {
		expect(detectLicenseTitle('preGNU GENERAL PUBLIC LICENSE \nVersion 1, February 1989')).not.toBe('GPL-1.0*');
		expect(detectLicenseTitle('preGNU GENERAL PUBLIC LICENSE \nVersion 2, June 1991')).not.toBe('GPL-2.0*');
		expect(detectLicenseTitle('preGNU GENERAL PUBLIC LICENSE \nVersion 3, 29 June 2007')).not.toBe('GPL-3.0*');
	});

	it('LGPL word check', () => {
		expect(detectLicenseTitle('GNU LIBRARY GENERAL PUBLIC LICENSE\nVersion 2, June 1991')).toBe('LGPL-2.0*');
		expect(detectLicenseTitle('GNU LESSER GENERAL PUBLIC LICENSE\nVersion 2.1, February 1999')).toBe('LGPL-2.1*');
		expect(detectLicenseTitle('GNU LESSER GENERAL PUBLIC LICENSE \nVersion 3, 29 June 2007')).toBe('LGPL-3.0*');
	});

	it('BSD check', () => {
		expect(detectLicenseTitle('asdf\nRedistribution and use in source and binary forms, with or without\nasdf\n')).toBe(
			'BSD*'
		);
	});

	it('BSD-Source-Code check', () => {
		expect(
			detectLicenseTitle(
				'asdf\nRedistribution and use of this software in source and binary forms, with or without modification, are permitted provided that the following conditions are met:\nasdf\n'
			)
		).toBe('BSD-Source-Code*');
	});

	it('BSD word check', () => {
		expect(detectLicenseTitle('asdf\nasdf\nBSD\nasdf\n')).toBe('BSD*');
	});

	it('Non-BSD word check', () => {
		expect(detectLicenseTitle('prefixBSD\n')).not.toBe('BSD*');
	});

	it('Apache version check', () => {
		expect(detectLicenseTitle('asdf\nasdf\nApache License Version 2\nasdf\n')).toBe('Apache-2.0*');
	});

	it('Apache word check', () => {
		expect(detectLicenseTitle('asdf\nasdf\nApache License\nasdf\n')).toBe('Apache*');
	});

	it('Non-Apache word check', () => {
		expect(detectLicenseTitle('prefixApache License\n')).not.toBe('Apache*');
	});

	it('WTF check', () => {
		expect(detectLicenseTitle('DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE')).toBe('WTFPL*');
	});

	it('WTF word check', () => {
		expect(detectLicenseTitle('asdf\nasdf\nWTFPL\nasdf\n')).toBe('WTFPL*');
	});

	it('Non-WTF word check', () => {
		expect(detectLicenseTitle('prefixWTFPL\n')).not.toBe('WTFPL*');
	});

	it('ISC check', () => {
		expect(detectLicenseTitle('asdfasdf\nThe ISC License\nasdfasdf')).toBe('ISC*');
	});

	it('Non-ISC word check', () => {
		expect(detectLicenseTitle('prefixISC\n')).not.toBe('ISC*');
	});

	it('ISC word check', () => {
		expect(detectLicenseTitle('asdf\nasdf\nISC\nasdf\n')).toBe('ISC*');
	});

	it('CC0-1.0 word check', () => {
		expect(
			detectLicenseTitle(
				'The person who associated a work with this deed has dedicated the work to the public domain by waiving all of his or her rights to the work worldwide under copyright law, including all related and neighboring rights, to the extent allowed by law.\n\nYou can copy, modify, distribute and perform the work, even for commercial purposes, all without asking permission.\n'
			)
		).toBe('CC0-1.0*');
	});

	it('Public Domain check', () => {
		expect(detectLicenseTitle('Public Domain')).toBe('Public Domain');
		expect(detectLicenseTitle('public domain')).toBe('Public Domain');
		expect(detectLicenseTitle('Public domain')).toBe('Public Domain');
		expect(detectLicenseTitle('Public-Domain')).toBe('Public Domain');
		expect(detectLicenseTitle('Public_Domain')).toBe('Public Domain');
	});

	it('License at URL check', () => {
		expect(detectLicenseTitle('License: http://example.com/foo')).toBe('Custom: http://example.com/foo');
		expect(detectLicenseTitle('See license at http://example.com/foo')).toBe('Custom: http://example.com/foo');
		expect(detectLicenseTitle('license: https://example.com/foo')).toBe('Custom: https://example.com/foo');
	});

	it('Likely not a license at URL check', () => {
		expect(detectLicenseTitle('http://example.com/foo')).toBeNull();
		expect(detectLicenseTitle('See at http://example.com/foo')).toBeNull();
	});

	it('License at file check', () => {
		expect(detectLicenseTitle('See license in LICENSE.md')).toBe('Custom: LICENSE.md');
		expect(detectLicenseTitle('SEE LICENSE IN LICENSE.md')).toBe('Custom: LICENSE.md');
	});

	it('Check for null', () => {
		expect(detectLicenseTitle('this is empty, hi')).toBeNull();
	});

	describe('SPDX licenses', () => {
		it.each(['MIT', 'LGPL-2.0', 'Apache-2.0', 'BSD-2-Clause'])('should parse basic SPDX license %s', licenseType => {
			expect(detectLicenseTitle(licenseType)).toBe(licenseType);
		});

		it.each([
			'(GPL-2.0+ WITH Bison-exception-2.2)',
			'LGPL-2.0 OR (ISC AND BSD-3-Clause+)',
			'Apache-2.0 OR ISC OR MIT',
		])('should parse more complicated license expression %s', licenseType => {
			expect(detectLicenseTitle(licenseType)).toBe(licenseType);
		});
	});
});
