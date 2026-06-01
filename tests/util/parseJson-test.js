import { parseJson } from '../../lib/util/parseJson.js';

describe('json parsing', () => {
	it('should parse json successfully (File exists + was json)', () => {
		const path = './tests/config/custom_format_correct.json';
		const json = parseJson(path);
		assert.notEqual(json, undefined);
		assert.notEqual(json, null);
		assert.equal(json.licenseModified, 'no');
		assert.ok(json.licenseText);
	});

	it('should parse json with errors (File exists + no json)', () => {
		const path = './tests/config/custom_format_broken.json';
		const json = parseJson(path);
		assert.ok(json instanceof Error);
	});

	it('should parse json with errors (File not found)', () => {
		const path = './NotExitingFile.json';
		const json = parseJson(path);
		assert.ok(json instanceof Error);
	});

	it('should parse json with errors (null passed)', () => {
		const json = parseJson(null);
		assert.ok(json instanceof Error);
	});
});
