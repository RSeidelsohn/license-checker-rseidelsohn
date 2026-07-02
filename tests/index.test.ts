import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runLicenseCheck } from '../lib';
import pkgJson from '../package.json' with { type: 'json' };
import { hasPackage } from './test-helpers';

const repoPath = path.resolve(import.meta.dirname, '..');

describe('runLicenseCheck', () => {
	it('rejects on onlyAllow errors', async () => {
		const options = { start: repoPath, onlyAllow: 'ISC' };
		await expect(runLicenseCheck(options)).rejects.toThrow(
			/which is not permitted by the --onlyAllow flag\. Exiting\./
		);
	});

	it('rejects on failOn errors', async () => {
		const options = { start: repoPath, failOn: 'ISC' };
		await expect(runLicenseCheck(options)).rejects.toThrow(
			/Found license defined by the --failOn flag: "ISC"\. Exiting\./
		);
	});

	it('should parse with unknown', async () => {
		const output = await runLicenseCheck({
			start: repoPath,
			unknown: true,
		});
		expect(Object.keys(output).length).toBeGreaterThan(20);
	});

	it('should parse direct dependencies only', async () => {
		const output = await runLicenseCheck({
			start: repoPath,
			direct: 0, // 0 is the parsed value passed by the CLI if set to true
		});

		const count = Object.keys(pkgJson.dependencies || {}).length + Object.keys(pkgJson.devDependencies || {}).length;

		expect(Object.keys(output)).toHaveLength(count + 1); // + the main module itself
		expect(hasPackage(output, 'abbrev')).toBe(false);
	});
});
