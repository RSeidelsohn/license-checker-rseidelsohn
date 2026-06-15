import { describe, expect, it } from 'vitest';
import { parseJson } from '../../lib/util/parseJson.js';

describe('parseJson', () => {
	it('should parse json successfully (File exists + was json)', () => {
		const json = parseJson('./tests/config/custom_format_correct.json');
		expect(json.licenseModified).toBe('no');
		expect(json.licenseText).not.toBe('');
	});

	it('should parse json with errors (File exists + no json)', () => {
		const json = parseJson('./tests/config/custom_format_broken.json');
		expect(json).toBeInstanceOf(Error);
	});

	it('should parse json with errors (File not found)', () => {
		const json = parseJson('./NotExitingFile.json');
		expect(json).toBeInstanceOf(Error);
	});

	it('should parse json with errors (null passed)', () => {
		const json = parseJson(null);
		expect(json).toBeInstanceOf(Error);
	});
});
