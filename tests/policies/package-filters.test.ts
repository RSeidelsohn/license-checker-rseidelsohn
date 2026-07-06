import { describe, expect, it } from 'vitest';
import {
	excludePackages,
	excludePackagesStartingWith,
	excludePrivatePackages,
	getOptionArray,
	includePackages,
} from '../../lib/policies/package-filters.js';

const packages = {
	'@scope/foo@1.0.0': { licenses: 'MIT' },
	'bar@2.0.0': { licenses: 'ISC' },
	'private@1.0.0': { licenses: 'UNLICENSED', private: true },
};

describe('getOptionArray', () => {
	it('keeps arrays, splits strings, and rejects missing values', () => {
		expect(getOptionArray(['a'])).toEqual(['a']);
		expect(getOptionArray('a;b')).toEqual(['a', 'b']);
		expect(getOptionArray(undefined)).toBe(false);
	});
});

describe('package filters', () => {
	it('includes packages matching name selectors', () => {
		expect(Object.keys(includePackages(['bar'], packages))).toEqual(['bar@2.0.0']);
	});

	it('excludes packages matching name selectors', () => {
		expect(Object.keys(excludePackages(['bar'], packages))).toEqual(['@scope/foo@1.0.0', 'private@1.0.0']);
	});

	it('excludes packages by prefix', () => {
		expect(Object.keys(excludePackagesStartingWith(['@scope'], packages))).toEqual(['bar@2.0.0', 'private@1.0.0']);
	});

	it('excludes private packages', () => {
		expect(Object.keys(excludePrivatePackages(packages))).toEqual(['@scope/foo@1.0.0', 'bar@2.0.0']);
	});
});
