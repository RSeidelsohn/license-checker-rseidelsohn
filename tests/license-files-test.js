import { describe, expect, it } from 'vitest';
import { licenseFiles } from '../lib/license-files.js';

describe('license files detector', () => {
	it('should export a function', () => {
		expect(licenseFiles).toBeTypeOf('function');
	});

	it('no files', () => {
		expect(licenseFiles([])).toEqual([]);
	});

	it('no license files', () => {
		expect(licenseFiles(['.gitignore', 'TODO'])).toEqual([]);
	});

	it('one license candidate', () => {
		expect(licenseFiles(['LICENSE', '.gitignore', 'src'])).toEqual(['LICENSE']);
	});

	it('multiple license candidates detected in the right order', () => {
		expect(licenseFiles(['COPYING', '.gitignore', 'LICENCE', 'LICENSE', 'src', 'README'])).toEqual([
			'LICENSE',
			'LICENCE',
			'COPYING',
			'README',
		]);
	});

	it('extensions have no effect', () => {
		expect(licenseFiles(['LICENCE.txt', '.gitignore', 'src'])).toEqual(['LICENCE.txt']);
	});

	it('lower/upper case has no effect', () => {
		expect(licenseFiles(['LiCeNcE', '.gitignore', 'src'])).toEqual(['LiCeNcE']);
	});

	it('LICENSE-MIT gets matched', () => {
		expect(licenseFiles(['LICENSE', '.gitignore', 'LICENSE-MIT', 'src'])).toEqual(['LICENSE', 'LICENSE-MIT']);
	});

	it('only the first LICENSE-* file gets matched', () => {
		expect(licenseFiles(['license-foobar.txt', '.gitignore', 'LICENSE-MIT'])).toEqual(['license-foobar.txt']);
	});
});
