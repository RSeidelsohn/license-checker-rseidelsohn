import { spawn } from 'node:child_process';
import path from 'node:path';
import { text } from 'node:stream/consumers';
import { describe, expect, it } from 'vitest';

type BinResult = {
	code: number | null;
	stderr: string;
	stdout: string;
};

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const binPath = path.join(__dirname, '../bin/license-checker-rseidelsohn.js');
const repoPath = path.join(__dirname, '../');

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

describe('bin/license-checker-rseidelsohn', () => {
	it('should exit 1 if it finds a single license type (MIT) license due to --failOn MIT', async () => {
		const { code } = await runBin(['--failOn', 'MIT']);

		expect(code).toBe(1);
	});

	it('should exit 1 if it finds forbidden licenses license due to --failOn MIT;ISC', async () => {
		const { code } = await runBin(['--failOn', 'MIT;ISC']);

		expect(code).toBe(1);
	});

	it('should give warning about commas if --failOn MIT,ISC is provided', async () => {
		const { stderr } = await runBin(['--failOn', 'MIT,ISC']);

		expect(stderr).toContain('--failOn argument takes semicolons as delimeters instead of commas');
	});
}, /* timeout */ 8000);
