import { describe, expect, it } from 'vitest';
import { findLicenseFiles } from '../../lib/licenses/find-license-files.js';

describe('license files detector', () => {
	it('should export a function', () => {
		expect(findLicenseFiles).toBeTypeOf('function');
	});

	it('no files', () => {
		expect(findLicenseFiles([])).toEqual([]);
	});

	it('no license files', () => {
		expect(findLicenseFiles(['.gitignore', 'TODO'])).toEqual([]);
	});

	it('one license candidate', () => {
		expect(findLicenseFiles(['LICENSE', '.gitignore', 'src'])).toEqual(['LICENSE']);
	});

	it('multiple license candidates detected in the right order', () => {
		expect(findLicenseFiles(['COPYING', '.gitignore', 'LICENCE', 'LICENSE', 'src', 'README'])).toEqual([
			'LICENSE',
			'LICENCE',
			'COPYING',
			'README',
		]);
	});

	it('extensions have no effect', () => {
		expect(findLicenseFiles(['LICENCE.txt', '.gitignore', 'src'])).toEqual(['LICENCE.txt']);
	});

	it('lower/upper case has no effect', () => {
		expect(findLicenseFiles(['LiCeNcE', '.gitignore', 'src'])).toEqual(['LiCeNcE']);
	});

	it('LICENSE-MIT gets matched', () => {
		expect(findLicenseFiles(['LICENSE', '.gitignore', 'LICENSE-MIT', 'src'])).toEqual(['LICENSE', 'LICENSE-MIT']);
	});

	it('only the first LICENSE-* file gets matched', () => {
		expect(findLicenseFiles(['license-foobar.txt', '.gitignore', 'LICENSE-MIT'])).toEqual(['license-foobar.txt']);
	});
});
