import { describe, expect, it } from 'vitest';
import {
	checkForFailOn,
	checkForOnlyAllow,
	getLicenseMatch,
	getLicensePolicy,
	throwIfLicensePolicyFails,
} from '../../lib/policies/license-policy.js';

describe('getLicensePolicy', () => {
	it('parses failOn policies and keeps failOn precedence over onlyAllow', () => {
		expect(getLicensePolicy({ failOn: 'MIT; ISC', onlyAllow: 'BSD' })).toEqual({
			failOnLicenses: ['MIT', 'ISC'],
			onlyAllowLicenses: [],
		});
	});

	it('parses onlyAllow policies when no failOn policy is present', () => {
		expect(getLicensePolicy({ onlyAllow: 'MIT; ISC' })).toEqual({
			failOnLicenses: [],
			onlyAllowLicenses: ['MIT', 'ISC'],
		});
	});
});

describe('license policy checks', () => {
	it('throws on failOn matches', () => {
		expect(() => checkForFailOn('MIT', ['MIT'])).toThrow(/--failOn flag: "MIT"/);
	});

	it('throws when onlyAllow does not match', () => {
		expect(() => checkForOnlyAllow('Apache-2.0', 'pkg@1.0.0', ['MIT'])).toThrow(/not permitted/);
	});

	it('allows licenses matching onlyAllow', () => {
		expect(() => checkForOnlyAllow('ISC', 'pkg@1.0.0', ['ISC'])).not.toThrow();
	});

	it('checks a package policy wrapper', () => {
		expect(() =>
			throwIfLicensePolicyFails({
				currentLicense: 'MIT',
				failOnLicenses: ['MIT'],
				onlyAllowLicenses: [],
				packageName: 'pkg@1.0.0',
			})
		).toThrow(/--failOn flag/);
	});
});

describe('getLicenseMatch', () => {
	it('matches BSD shorthand against SPDX BSD variants', () => {
		expect(getLicenseMatch(['BSD-3-Clause'], ['BSD'])).toEqual({ hasUnknownLicense: false, match: true });
	});

	it('marks unknown licenses without treating them as a compare match', () => {
		expect(getLicenseMatch(['UNKNOWN'], ['MIT'])).toEqual({ hasUnknownLicense: true, match: false });
	});
});
