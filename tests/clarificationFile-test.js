import assert from 'node:assert';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { describe } from 'node:test';
import { runLicenseCheck } from '../lib/index.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

describe('clarifications', () => {
	const clarifications_path = './fixtures/clarifications';
	const result = {};

	beforeAll(async () => {
		result.output = await runLicenseCheck({
			start: path.join(__dirname, clarifications_path),
			clarificationsFile: path.join(__dirname, '../clarificationExample.json'),
			customFormat: {
				licenses: '',
				publisher: '',
				email: '',
				path: '',
				licenseFile: '',
				licenseText: '',
			},
		});
	});

	it('should replace existing license', () => {
		const output = result.output['license-checker-rseidelsohn@0.0.0'];

		assert.equal(output.licenseText, 'Some mild rephrasing of an MIT license');
		assert.equal(output.licenses, 'MIT');
	});

	it('should exit 1 if the checksum does not match', done => {
		let stderrData = '';
		let stdoutData = '';
		const license_checker = spawn(
			'node',
			[
				path.join(__dirname, '../bin/license-checker-rseidelsohn'),
				'--start',
				path.join(__dirname, clarifications_path),
				'--clarificationsFile',
				path.join(__dirname, clarifications_path, 'mismatch/clarification.json'),
			],
			{
				cwd: path.join(__dirname, '../'),
			}
		);

		license_checker.stderr.on('data', stderr => {
			stderrData += stderr.toString();
		});

		license_checker.stdout.on('data', stdout => {
			stdoutData += stdout.toString();
		});

		license_checker.on('exit', code => {
			assert.equal(code, 1);
			assert.equal(stdoutData, '');
			assert.equal(stderrData.includes('checksum mismatch'), true);
			done();
		});
	});

	it('should reject if the checksum does not match', async () => {
		await assert.rejects(
			runLicenseCheck({
				start: path.join(__dirname, clarifications_path),
				clarificationsFile: path.join(__dirname, clarifications_path, 'mismatch/clarification.json'),
			}),
			/Clarification checksum mismatch/
		);
	});

	it('should reject if a checksum clarification cannot be checked against a license file', async () => {
		await assert.rejects(
			runLicenseCheck({
				start: path.join(__dirname, 'fixtures/noLicenseFile'),
				clarificationsFile: path.join(__dirname, clarifications_path, 'checksumWithoutLicenseFile.json'),
			}),
			/All clarifications must come with a checksum/
		);
	});

	it('should reject if clarificationsMatchAll leaves unused clarifications', async () => {
		await assert.rejects(
			runLicenseCheck({
				start: path.join(__dirname, clarifications_path),
				clarificationsFile: path.join(__dirname, clarifications_path, 'unusedClarification.json'),
				clarificationsMatchAll: true,
			}),
			/Some clarifications \(unused-package@1\.0\.0\) were unused and --clarificationsMatchAll was specified\. Exiting\./
		);
	});

	it('should succeed if no checksum is specified', done => {
		let data = '';

		const license_checker = spawn(
			'node',
			[
				path.join(__dirname, '../bin/license-checker-rseidelsohn'),
				'--start',
				path.join(__dirname, clarifications_path),
				'--clarificationsFile',
				path.join(__dirname, clarifications_path, 'example/noChecksum.json'),
			],
			{
				cwd: path.join(__dirname, '../'),
			}
		);

		license_checker.stdout.on('data', stdout => {
			data += stdout.toString();
		});

		license_checker.on('exit', code => {
			assert.equal(code, 0);
			assert.equal(data.includes('MIT'), true);
			assert.equal(data.includes('MY_IP'), true);
			done();
		});
	});

	it('should snip the embedded license out of the README', done => {
		let data = '';

		const license_checker = spawn(
			'node',
			[
				path.join(__dirname, '../bin/license-checker-rseidelsohn'),
				'--start',
				path.join(__dirname, clarifications_path),
				'--clarificationsFile',
				path.join(__dirname, clarifications_path, 'weirdStart/clarification.json'),
				'--customPath',
				path.join(__dirname, clarifications_path, 'weirdStart/customFormat.json'),
			],
			{
				cwd: path.join(__dirname, '../'),
			}
		);

		license_checker.stdout.on('data', stdout => {
			data += stdout.toString();
		});

		license_checker.on('exit', code => {
			assert.equal(code, 0);
			assert.equal(data.includes('README'), true);
			assert.equal(data.includes('text text text describing the project'), false);
			assert.equal(data.includes('# LICENSE'), true);
			assert.equal(data.includes('Standard MIT license'), true);
			assert.equal(data.includes('# And one more thing...'), false);
			assert.equal(data.includes('More text AFTER the license because the real world is difficult :('), false);
			done();
		});
	});

	it('should snip the embedded license in the README to the end.', done => {
		let data = '';

		const license_checker = spawn(
			'node',
			[
				path.join(__dirname, '../bin/license-checker-rseidelsohn'),
				'--start',
				path.join(__dirname, clarifications_path),
				'--clarificationsFile',
				path.join(__dirname, clarifications_path, 'weirdStart/startOnlyClarification.json'),
				'--customPath',
				path.join(__dirname, clarifications_path, 'weirdStart/customFormat.json'),
			],
			{
				cwd: path.join(__dirname, '../'),
			}
		);

		license_checker.stdout.on('data', stdout => {
			data += stdout.toString();
		});

		license_checker.on('exit', code => {
			assert.equal(code, 0);
			assert.equal(data.includes('README'), true);
			assert.equal(data.includes('text text text describing the project'), false);
			assert.equal(data.includes('# LICENSE'), true);
			assert.equal(data.includes('Standard MIT license'), true);
			assert.equal(data.includes('# And one more thing...'), true);
			assert.equal(data.includes('More text AFTER the license because the real world is difficult :('), true);
			done();
		});
	});
});
