import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { runLicenseCheck } from '../lib';
import { runBin } from './test-helpers';

type LicenseCheckOutput = Awaited<ReturnType<typeof runLicenseCheck>>;

const fixturesPath = path.join(import.meta.dirname, 'fixtures');
const clarificationsPath = path.join(fixturesPath, 'clarifications');
const clarificationExamplePath = path.join(import.meta.dirname, '../clarificationExample.json');

describe('clarifications', () => {
	const result: { output: LicenseCheckOutput } = { output: {} };

	beforeAll(async () => {
		result.output = await runLicenseCheck({
			start: clarificationsPath,
			clarificationsFile: clarificationExamplePath,
			customFormat: { licenses: '', publisher: '', email: '', path: '', licenseFile: '', licenseText: '' },
		});
	});

	it('should replace existing license', () => {
		const output = result.output['license-checker-rseidelsohn@0.0.0'];

		expect(output.licenseText).toBe('Some mild rephrasing of an MIT license');
		expect(output.licenses).toBe('MIT');
	});

	it('should exit 1 if the checksum does not match', async () => {
		const { code, stderr, stdout } = await runBin([
			'--start',
			clarificationsPath,
			'--clarificationsFile',
			path.join(clarificationsPath, 'mismatch/clarification.json'),
		]);

		expect(code).toBe(1);
		expect(stdout).toBe('');
		expect(stderr).toContain('checksum mismatch');
	});

	it('should reject if the checksum does not match', async () => {
		await expect(
			runLicenseCheck({
				start: clarificationsPath,
				clarificationsFile: path.join(clarificationsPath, 'mismatch/clarification.json'),
			})
		).rejects.toThrow(/Clarification checksum mismatch/);
	});

	it('should reject if a checksum clarification cannot be checked against a license file', async () => {
		await expect(
			runLicenseCheck({
				start: path.join(fixturesPath, 'noLicenseFile'),
				clarificationsFile: path.join(clarificationsPath, 'checksumWithoutLicenseFile.json'),
			})
		).rejects.toThrow(/All clarifications must come with a checksum/);
	});

	it('should reject if clarificationsMatchAll leaves unused clarifications', async () => {
		await expect(
			runLicenseCheck({
				start: clarificationsPath,
				clarificationsFile: path.join(clarificationsPath, 'unusedClarification.json'),
				clarificationsMatchAll: true,
			})
		).rejects.toThrow(
			/Some clarifications \(unused-package@1\.0\.0\) were unused and --clarificationsMatchAll was specified\. Exiting\./
		);
	});

	it('should succeed if no checksum is specified', async () => {
		const { code, stdout } = await runBin([
			'--start',
			clarificationsPath,
			'--clarificationsFile',
			path.join(clarificationsPath, 'example/noChecksum.json'),
		]);

		expect(code).toBe(0);
		expect(stdout).toContain('MIT');
		expect(stdout).toContain('MY_IP');
	});

	it('should snip the embedded license out of the README', async () => {
		const { code, stdout } = await runBin([
			'--start',
			clarificationsPath,
			'--clarificationsFile',
			path.join(clarificationsPath, 'weirdStart/clarification.json'),
			'--customPath',
			path.join(clarificationsPath, 'weirdStart/customFormat.json'),
		]);

		expect(code).toBe(0);
		expect(stdout).toContain('README');
		expect(stdout).not.toContain('text text text describing the project');
		expect(stdout).toContain('# LICENSE');
		expect(stdout).toContain('Standard MIT license');
		expect(stdout).not.toContain('# And one more thing...');
		expect(stdout).not.toContain('More text AFTER the license because the real world is difficult :(');
	});

	it('should snip the embedded license in the README to the end.', async () => {
		const { code, stdout } = await runBin([
			'--start',
			clarificationsPath,
			'--clarificationsFile',
			path.join(clarificationsPath, 'weirdStart/startOnlyClarification.json'),
			'--customPath',
			path.join(clarificationsPath, 'weirdStart/customFormat.json'),
		]);

		expect(code).toBe(0);
		expect(stdout).toContain('README');
		expect(stdout).not.toContain('text text text describing the project');
		expect(stdout).toContain('# LICENSE');
		expect(stdout).toContain('Standard MIT license');
		expect(stdout).toContain('# And one more thing...');
		expect(stdout).toContain('More text AFTER the license because the real world is difficult :(');
	});
});
