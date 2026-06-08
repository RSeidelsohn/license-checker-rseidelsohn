import assert from 'node:assert';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { text } from 'node:stream/consumers';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const binPath = path.join(__dirname, '../bin/license-checker-rseidelsohn');
const fixturePath = path.join(__dirname, 'fixtures/custom-license-url');
const fixturePackageName = 'custom-license@0.0.0';
const fixtureLicense = 'Custom: http://example.com/dummy-license';

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
}, /* timeout */ 8000);
