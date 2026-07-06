import { spawn } from 'node:child_process';
import path from 'node:path';
import { text } from 'node:stream/consumers';
import { expect } from 'vitest';

export type BinResult = {
	code: number | null;
	stderr: string;
	stdout: string;
};

export type RunBinOptions = {
	cwd?: string;
};

const repoPath = path.resolve(import.meta.dirname, '..');
const binPath = path.join(repoPath, 'lib/cli.js');

export const runBin = (args: string[], options: RunBinOptions = {}) =>
	new Promise<BinResult>((resolve, reject) => {
		const proc = spawn('node', [binPath, ...args], {
			cwd: options.cwd ?? repoPath,
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		const stdout = text(proc.stdout);
		const stderr = text(proc.stderr);

		proc.on('error', reject);
		proc.on('close', async code => {
			resolve({ code, stderr: await stderr, stdout: await stdout });
		});
	});

// biome-ignore lint/suspicious/noExplicitAny: JSON not typed correctly yet
export const getPackageKey = (output: any, packageName: string) => {
	const packageKey = Object.keys(output).find(key => key.startsWith(`${packageName}@`));
	expect(packageKey, `Expected ${packageName} in output`).toBeTruthy();
	if (!packageKey) {
		throw new Error(`Expected ${packageName} in output`);
	}
	return packageKey;
};

// biome-ignore lint/suspicious/noExplicitAny: JSON not typed correctly yet
export const hasPackage = (output: any, packageName: string) =>
	Object.keys(output).some(key => key.startsWith(`${packageName}@`));
