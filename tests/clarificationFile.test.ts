import { spawn } from 'node:child_process';
import path from 'node:path';
import { text } from 'node:stream/consumers';
import { beforeAll, describe, expect, it } from 'vitest';
import { runLicenseCheck } from '../lib';

type BinResult = {
	code: number | null;
	stderr: string;
	stdout: string;
};

type LicenseCheckOutput = Record<string, { licenses?: string | string[]; licenseText?: string }>;

type RunLicenseCheckOptions = {
	start: string;
	[key: string]: unknown;
};

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const binPath = path.join(__dirname, '../bin/license-checker-rseidelsohn.js');
const repoPath = path.join(__dirname, '../');

const runLicenseCheckForTest = (options: RunLicenseCheckOptions) =>
	runLicenseCheck(options as Parameters<typeof runLicenseCheck>[0]) as unknown as Promise<LicenseCheckOutput>;

const runBin = (args: string[]) =>
	new Promise<BinResult>((resolve, reject) => {
		const proc = spawn('node', [binPath, ...args], {
			cwd: repoPath,
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		const stdout = text(proc.stdout);
		const stderr = text(proc.stderr);

		proc.on('error', reject);
		proc.on('close', async code => {
			resolve({ code, stderr: await stderr, stdout: await stdout });
		});
	});

describe('clarifications', () => {
	const clarificationsPath = './fixtures/clarifications';
	const result: { output: LicenseCheckOutput } = { output: {} };

	beforeAll(async () => {
		result.output = await runLicenseCheckForTest({
			start: path.join(__dirname, clarificationsPath),
			clarificationsFile: path.join(__dirname, '../clarificationExample.json'),
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
			path.join(__dirname, clarificationsPath),
			'--clarificationsFile',
			path.join(__dirname, clarificationsPath, 'mismatch/clarification.json'),
		]);

		expect(code).toBe(1);
		expect(stdout).toBe('');
		expect(stderr).toContain('checksum mismatch');
	});

	it('should reject if the checksum does not match', async () => {
		await expect(
			runLicenseCheckForTest({
				start: path.join(__dirname, clarificationsPath),
				clarificationsFile: path.join(__dirname, clarificationsPath, 'mismatch/clarification.json'),
			})
		).rejects.toThrow(/Clarification checksum mismatch/);
	});

	it('should reject if a checksum clarification cannot be checked against a license file', async () => {
		await expect(
			runLicenseCheckForTest({
				start: path.join(__dirname, 'fixtures/noLicenseFile'),
				clarificationsFile: path.join(__dirname, clarificationsPath, 'checksumWithoutLicenseFile.json'),
			})
		).rejects.toThrow(/All clarifications must come with a checksum/);
	});

	it('should reject if clarificationsMatchAll leaves unused clarifications', async () => {
		await expect(
			runLicenseCheckForTest({
				start: path.join(__dirname, clarificationsPath),
				clarificationsFile: path.join(__dirname, clarificationsPath, 'unusedClarification.json'),
				clarificationsMatchAll: true,
			})
		).rejects.toThrow(
			/Some clarifications \(unused-package@1\.0\.0\) were unused and --clarificationsMatchAll was specified\. Exiting\./
		);
	});

	it('should succeed if no checksum is specified', async () => {
		const { code, stdout } = await runBin([
			'--start',
			path.join(__dirname, clarificationsPath),
			'--clarificationsFile',
			path.join(__dirname, clarificationsPath, 'example/noChecksum.json'),
		]);

		expect(code).toBe(0);
		expect(stdout).toContain('MIT');
		expect(stdout).toContain('MY_IP');
	});

	it('should snip the embedded license out of the README', async () => {
		const { code, stdout } = await runBin([
			'--start',
			path.join(__dirname, clarificationsPath),
			'--clarificationsFile',
			path.join(__dirname, clarificationsPath, 'weirdStart/clarification.json'),
			'--customPath',
			path.join(__dirname, clarificationsPath, 'weirdStart/customFormat.json'),
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
			path.join(__dirname, clarificationsPath),
			'--clarificationsFile',
			path.join(__dirname, clarificationsPath, 'weirdStart/startOnlyClarification.json'),
			'--customPath',
			path.join(__dirname, clarificationsPath, 'weirdStart/customFormat.json'),
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
