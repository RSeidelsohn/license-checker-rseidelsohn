import assert from 'assert';
import { licenseFiles } from '../lib/license-files.js';

describe('license files detector', () => {
    it('should export a function', () => {
        assert.equal(typeof licenseFiles, 'function');
    });

    it('no files', () => {
        assert.deepEqual(licenseFiles([]), []);
    });

    it('no license files', () => {
        assert.deepEqual(licenseFiles(['.gitignore', 'TODO']), []);
    });

    it('one license candidate', () => {
        assert.deepEqual(licenseFiles(['LICENSE', '.gitignore', 'src']), ['LICENSE']);
    });

    it('multiple license candidates detected in the right order', () => {
        assert.deepEqual(licenseFiles(['COPYING', '.gitignore', 'LICENCE', 'LICENSE', 'src', 'README']), [
            'LICENSE',
            'LICENCE',
            'COPYING',
            'README',
        ]);
    });

    it('extensions have no effect', () => {
        assert.deepEqual(licenseFiles(['LICENCE.txt', '.gitignore', 'src']), ['LICENCE.txt']);
    });

    it('lower/upper case has no effect', () => {
        assert.deepEqual(licenseFiles(['LiCeNcE', '.gitignore', 'src']), ['LiCeNcE']);
    });

    it('LICENSE-MIT gets matched', () => {
        assert.deepEqual(licenseFiles(['LICENSE', '.gitignore', 'LICENSE-MIT', 'src']), ['LICENSE', 'LICENSE-MIT']);
    });

    it('only the first LICENSE-* file gets matched', () => {
        assert.deepEqual(licenseFiles(['license-foobar.txt', '.gitignore', 'LICENSE-MIT']), ['license-foobar.txt']);
    });
});
