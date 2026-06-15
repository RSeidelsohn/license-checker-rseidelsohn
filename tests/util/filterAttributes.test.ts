import { describe, expect, it } from 'vitest';
import { filterAttributes } from '../../lib/util/filterAttributes.js';
import { parseJson } from '../../lib/util/parseJson.js';

describe('filterAttributes', () => {
	const path = './tests/config/custom_format_correct.json';
	const json = parseJson(path);

	it('should filter attributes based on limitAttributes defined', () => {
		const filteredJson = filterAttributes(['version', 'name'], json);

		expect(filteredJson.name).not.toBeUndefined();
		expect(filteredJson.version).not.toBeUndefined();
		expect(filteredJson.description).toBeUndefined();
		expect(filteredJson.licenses).toBeUndefined();
		expect(filteredJson.licenseFile).toBeUndefined();
		expect(filteredJson.licenseText).toBeUndefined();
		expect(filteredJson.licenseModified).toBeUndefined();
	});

	it('should keep json as is if no outputColumns defined', () => {
		const filteredJson = filterAttributes(null, json);

		expect(filteredJson.version).not.toBeUndefined();
		expect(filteredJson.name).not.toBeUndefined();
		expect(filteredJson.description).not.toBeUndefined();
		expect(filteredJson.licenses).not.toBeUndefined();
		expect(filteredJson.licenseFile).not.toBeUndefined();
		expect(filteredJson.licenseText).not.toBeUndefined();
		expect(filteredJson.licenseModified).not.toBeUndefined();
	});
});
