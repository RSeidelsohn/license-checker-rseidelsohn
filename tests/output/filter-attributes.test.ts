import { describe, expect, it } from 'vitest';
import { readJson } from '../../lib/files/read-json.js';
import { filterAttributes } from '../../lib/output/filter-attributes.js';

describe('filterAttributes', () => {
	const path = './tests/config/custom_format_correct.json';
	const json = readJson(path);

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
