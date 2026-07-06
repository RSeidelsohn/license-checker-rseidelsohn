import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assertAllClarificationsWereUsed, readClarifications } from '../../lib/licenses/clarifications.js';

const clarificationsPath = path.join(import.meta.dirname, '../fixtures/clarifications');

describe('readClarifications', () => {
	it('groups clarifications by package name and stores semver ranges', () => {
		const clarifications = readClarifications(path.join(clarificationsPath, 'example/noChecksum.json')) as Record<
			string,
			Array<{ licenses: string; semverRange: string; used: boolean }>
		>;

		expect(clarifications['license-checker-rseidelsohn'][0]).toMatchObject({
			licenses: 'MIT',
			semverRange: '0.0.0',
			used: false,
		});
	});
});

describe('assertAllClarificationsWereUsed', () => {
	it('throws when at least one clarification was not used', () => {
		expect(() =>
			assertAllClarificationsWereUsed({
				package: [{ semverRange: '1.0.0', used: false }],
			})
		).toThrow(/Some clarifications \(package@1\.0\.0\) were unused/);
	});

	it('allows used clarifications', () => {
		expect(() =>
			assertAllClarificationsWereUsed({
				package: [{ semverRange: '1.0.0', used: true }],
			})
		).not.toThrow();
	});
});
