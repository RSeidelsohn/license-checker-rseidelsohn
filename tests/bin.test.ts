import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import packageJson from '../package.json' with { type: 'json' };
import { runBin } from './test-helpers';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const fixturePath = path.join(__dirname, 'fixtures/custom-license-url');
const repoPath = path.join(__dirname, '../');
const fixturePackageName = 'custom-license@0.0.0';
const fixtureLicense = 'Custom: http://example.com/dummy-license';
const tempPath = (name: string) => path.join(tmpdir(), `license-checker-rseidelsohn-${Date.now()}-${name}`);

describe('bin/license-checker-rseidelsohn', () => {
	it('should exit 0', async () => {
		const { code } = await runBin([], { cwd: path.join(__dirname, '../') });

		expect(code).toBe(0);
	});

	it('should output CSV from the CLI', async () => {
		const { code, stderr, stdout } = await runBin(['--csv'], { cwd: fixturePath });

		expect(stderr).toBe('');
		expect(code).toBe(0);
		expect(stdout).toBe(`"module name","license","repository"\n"${fixturePackageName}","${fixtureLicense}",""\n`);
	});

	it('should output JSON from the CLI', async () => {
		const { code, stderr, stdout } = await runBin(['--json'], { cwd: fixturePath });
		const output = JSON.parse(stdout);

		expect(stderr).toBe('');
		expect(code).toBe(0);
		expect(output[fixturePackageName].licenses).toBe(fixtureLicense);
	});

	it('should output Markdown from the CLI', async () => {
		const { code, stderr, stdout } = await runBin(['--markdown'], { cwd: fixturePath });

		expect(stderr).toBe('');
		expect(code).toBe(0);
		expect(stdout).toBe(`- [${fixturePackageName}](undefined) - ${fixtureLicense}\n\n`);
	});

	it('should output summary from the CLI', async () => {
		const { code, stderr, stdout } = await runBin(['--summary'], { cwd: fixturePath });

		expect(stderr).toBe('');
		expect(code).toBe(0);
		expect(stdout).toMatch(new RegExp(`${fixtureLicense.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}: 1`));
	});

	it('should output plain vertical format from the CLI', async () => {
		const { code, stderr, stdout } = await runBin(['--plainVertical'], { cwd: fixturePath });

		expect(stderr).toBe('');
		expect(code).toBe(0);
		expect(stdout.startsWith(`custom-license 0.0.0\n${fixtureLicense}\n`)).toBe(true);
		expect(stdout).toContain('http://totally.not.a.valid.license.com/banana');
	});

	it('should output tree format from the CLI', async () => {
		const { code, stderr, stdout } = await runBin([], { cwd: fixturePath });

		expect(stderr).toBe('');
		expect(code).toBe(0);
		expect(stdout).toContain(fixturePackageName);
		expect(stdout).toContain(fixtureLicense);
	});

	it('should output the package version from the CLI', async () => {
		const { code, stderr, stdout } = await runBin(['--version'], { cwd: fixturePath });

		expect(code).toBe(1);
		expect(stdout).toBe('');
		expect(stderr.trim()).toBe(packageJson.version);
	});

	it('should exit 1 without stdout if --failOn MIT finds a matching license', async () => {
		const { code, stderr, stdout } = await runBin(['--failOn', 'MIT'], { cwd: repoPath });

		expect(code).toBe(1);
		expect(stdout).toBe('');
		expect(stderr).toMatch(/Found license defined by the --failOn flag: "MIT"\. Exiting\./);
	});

	it('should exit 1 without stdout if --onlyAllow rejects a license', async () => {
		const { code, stderr, stdout } = await runBin(['--onlyAllow', 'MIT'], { cwd: fixturePath });

		expect(code).toBe(1);
		expect(stdout).toBe('');
		expect(stderr).toMatch(
			/Package "custom-license@0\.0\.0" is licensed under "Custom: http:\/\/example\.com\/dummy-license" which is not permitted by the --onlyAllow flag\. Exiting\./
		);
	});

	it('should not create --out file when a policy error occurs', async () => {
		const outFile = tempPath('policy-error.json');
		const { code, stderr, stdout } = await runBin(['--json', '--out', outFile, '--onlyAllow', 'MIT'], {
			cwd: fixturePath,
		});

		expect(code).toBe(1);
		expect(stdout).toBe('');
		expect(stderr).toMatch(/which is not permitted by the --onlyAllow flag\. Exiting\./);
		expect(fs.existsSync(outFile)).toBe(false);
	});

	it('should not create --files output when a policy error occurs', async () => {
		const outDir = tempPath('policy-error-files');
		const { code, stderr, stdout } = await runBin(['--files', outDir, '--onlyAllow', 'ISC'], {
			cwd: path.join(__dirname, 'fixtures/license-file-only'),
		});

		expect(code).toBe(1);
		expect(stdout).toBe('');
		expect(stderr).toMatch(/which is not permitted by the --onlyAllow flag\. Exiting\./);
		expect(fs.existsSync(outDir)).toBe(false);
	});

	it('should exit 1 without stdout on dependency read errors', async () => {
		const missingPath = path.join(__dirname, 'fixtures/does-not-exist');
		const { code, stderr, stdout } = await runBin(['--start', missingPath], { cwd: repoPath });

		expect(code).toBe(1);
		expect(stdout).toBe('');
		expect(stderr).not.toBe('');
		expect(stderr).not.toContain(' at ');
	});

	it('should write --out files on success', async () => {
		const outFile = tempPath('success.json');
		const { code, stderr, stdout } = await runBin(['--json', '--out', outFile], { cwd: fixturePath });
		const output = JSON.parse(fs.readFileSync(outFile, 'utf8'));

		expect(stderr).toBe('');
		expect(stdout).toBe('');
		expect(code).toBe(0);
		expect(output[fixturePackageName].licenses).toBe(fixtureLicense);
		fs.rmSync(outFile);
	});

	it('should write --files output on success', async () => {
		const outDir = tempPath('files');
		const { code, stderr } = await runBin(['--files', outDir], {
			cwd: path.join(__dirname, 'fixtures/license-file-only'),
		});
		const files = fs.readdirSync(outDir);

		expect(stderr).toBe('');
		expect(code).toBe(0);
		expect(files).toContain('license-file-only@1.2.3-LICENSE.txt');
		fs.rmSync(outDir, { recursive: true });
	});
}, /* timeout */ 8000);
