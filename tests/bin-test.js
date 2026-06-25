import assert from 'node:assert';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { text } from 'node:stream/consumers';
import packageJson from '../package.json' with { type: 'json' };

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const binPath = path.join(__dirname, '../bin/license-checker-rseidelsohn');
const fixturePath = path.join(__dirname, 'fixtures/custom-license-url');
const repoPath = path.join(__dirname, '../');
const fixturePackageName = 'custom-license@0.0.0';
const fixtureLicense = 'Custom: http://example.com/dummy-license';
const tempPath = name => path.join(tmpdir(), `license-checker-rseidelsohn-${Date.now()}-${name}`);

const runBin = (args, cwd = fixturePath) =>
	new Promise((resolve, reject) => {
		const proc = spawn('node', [binPath, ...args], {
			cwd,
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		const stdout = text(proc.stdout);
		const stderr = text(proc.stderr);

		proc.on('error', reject);
		proc.on('close', async code => {
			resolve({ code, stderr: await stderr, stdout: await stdout });
		});
	});

describe('bin/license-checker-rseidelsohn', () => {
	it('should exit 0', async () => {
		const { code } = await runBin([], path.join(__dirname, '../'));

		assert.equal(code, 0);
	});

	it('should output CSV from the CLI', async () => {
		const { code, stderr, stdout } = await runBin(['--csv']);

		assert.equal(stderr, '');
		assert.equal(code, 0);
		assert.equal(stdout, `"module name","license","repository"\n"${fixturePackageName}","${fixtureLicense}",""\n`);
	});

	it('should output JSON from the CLI', async () => {
		const { code, stderr, stdout } = await runBin(['--json']);
		const output = JSON.parse(stdout);

		assert.equal(stderr, '');
		assert.equal(code, 0);
		assert.equal(output[fixturePackageName].licenses, fixtureLicense);
	});

	it('should output Markdown from the CLI', async () => {
		const { code, stderr, stdout } = await runBin(['--markdown']);

		assert.equal(stderr, '');
		assert.equal(code, 0);
		assert.equal(stdout, `- [${fixturePackageName}](undefined) - ${fixtureLicense}\n\n`);
	});

	it('should output summary from the CLI', async () => {
		const { code, stderr, stdout } = await runBin(['--summary']);

		assert.equal(stderr, '');
		assert.equal(code, 0);
		assert.match(stdout, new RegExp(`${fixtureLicense.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}: 1`));
	});

	it('should output plain vertical format from the CLI', async () => {
		const { code, stderr, stdout } = await runBin(['--plainVertical']);

		assert.equal(stderr, '');
		assert.equal(code, 0);
		assert.ok(stdout.startsWith(`custom-license 0.0.0\n${fixtureLicense}\n`));
		assert.ok(stdout.includes('http://totally.not.a.valid.license.com/banana'));
	});

	it('should output tree format from the CLI', async () => {
		const { code, stderr, stdout } = await runBin([]);

		assert.equal(stderr, '');
		assert.equal(code, 0);
		assert.ok(stdout.includes(fixturePackageName));
		assert.ok(stdout.includes(fixtureLicense));
	});

	it('should output the package version from the CLI', async () => {
		const { code, stderr, stdout } = await runBin(['--version']);

		assert.equal(code, 1);
		assert.equal(stdout, '');
		assert.equal(stderr.trim(), packageJson.version);
	});

	it('should exit 1 without stdout if --failOn MIT finds a matching license', async () => {
		const { code, stderr, stdout } = await runBin(['--failOn', 'MIT'], repoPath);

		assert.equal(code, 1);
		assert.equal(stdout, '');
		assert.match(stderr, /Found license defined by the --failOn flag: "MIT"\. Exiting\./);
	});

	it('should exit 1 without stdout if --onlyAllow rejects a license', async () => {
		const { code, stderr, stdout } = await runBin(['--onlyAllow', 'MIT']);

		assert.equal(code, 1);
		assert.equal(stdout, '');
		assert.match(
			stderr,
			/Package "custom-license@0\.0\.0" is licensed under "Custom: http:\/\/example\.com\/dummy-license" which is not permitted by the --onlyAllow flag\. Exiting\./
		);
	});

	it('should not create --out file when a policy error occurs', async () => {
		const outFile = tempPath('policy-error.json');
		const { code, stderr, stdout } = await runBin(['--json', '--out', outFile, '--onlyAllow', 'MIT']);

		assert.equal(code, 1);
		assert.equal(stdout, '');
		assert.match(stderr, /which is not permitted by the --onlyAllow flag\. Exiting\./);
		assert.equal(fs.existsSync(outFile), false);
	});

	it('should not create --files output when a policy error occurs', async () => {
		const outDir = tempPath('policy-error-files');
		const { code, stderr, stdout } = await runBin(
			['--files', outDir, '--onlyAllow', 'ISC'],
			path.join(__dirname, 'fixtures/license-file-only')
		);

		assert.equal(code, 1);
		assert.equal(stdout, '');
		assert.match(stderr, /which is not permitted by the --onlyAllow flag\. Exiting\./);
		assert.equal(fs.existsSync(outDir), false);
	});

	it('should exit 1 without stdout on dependency read errors', async () => {
		const missingPath = path.join(__dirname, 'fixtures/does-not-exist');
		const { code, stderr, stdout } = await runBin(['--start', missingPath], repoPath);

		assert.equal(code, 1);
		assert.equal(stdout, '');
		assert.notEqual(stderr, '');
		assert.equal(stderr.includes(' at '), false);
	});

	it('should write --out files on success', async () => {
		const outFile = tempPath('success.json');
		const { code, stderr, stdout } = await runBin(['--json', '--out', outFile]);
		const output = JSON.parse(fs.readFileSync(outFile, 'utf8'));

		assert.equal(stderr, '');
		assert.equal(stdout, '');
		assert.equal(code, 0);
		assert.equal(output[fixturePackageName].licenses, fixtureLicense);
		fs.rmSync(outFile);
	});

	it('should write --files output on success', async () => {
		const outDir = tempPath('files');
		const { code, stderr } = await runBin(['--files', outDir], path.join(__dirname, 'fixtures/license-file-only'));
		const files = fs.readdirSync(outDir);

		assert.equal(stderr, '');
		assert.equal(code, 0);
		assert.equal(files.includes('license-file-only@1.2.3-LICENSE.txt'), true);
		fs.rmSync(outDir, { recursive: true });
	});
}, /* timeout */ 8000);
