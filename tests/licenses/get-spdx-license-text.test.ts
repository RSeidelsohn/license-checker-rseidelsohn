import { describe, expect, it } from 'vitest';
import { getSpdxLicenseText } from '../../lib/licenses/get-spdx-license-text.js';

describe('getSpdxLicenseText', () => {
	it('returns canonical text for a simple SPDX identifier', () => {
		expect(getSpdxLicenseText('MIT')).toContain('Permission is hereby granted');
	});

	it.each([
		'MIT OR Apache-2.0',
		'GPL-2.0-only WITH Classpath-exception-2.0',
		'not-a-license',
	])('does not guess a single text for %s', licenseExpression => {
		expect(getSpdxLicenseText(licenseExpression)).toBeUndefined();
	});
});
