import { spawn } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const streamToString = stream =>
	new Promise((resolve, reject) => {
		const chunks = [];
		stream.on('data', chunk => chunks.push(chunk));
		stream.on('end', () => resolve(chunks.join('')));
		stream.on('error', reject);
	});

const runBin = async (args, opts = {}) => {
	const cwd = opts.cwd || path.join(__dirname, '../');
	const output = spawn('node', [path.join(__dirname, '../bin/license-checker-rseidelsohn'), ...args], {
		cwd,
		stdio: ['ignore', 'pipe', process.stderr],
	});
	return await streamToString(output.stdout);
};

describe('bin/license-checker-rseidelsohn', () => {
	it('should restrict the output to the provided packages', async () => {
		var includedPackages = ['@types/node@24.13.2'];
		var stdout = await runBin(['--json', '--includePackages', includedPackages.join(';')]);
		expect(Object.keys(JSON.parse(stdout))).toEqual(includedPackages);
	}, 15e3); // this test sometimes takes a while

	it('should exclude provided excludedPackages from the output', async () => {
		var excludedPackages = ['@types/node@24.13.2', 'spdx-satisfies@6.0.0'];
		var stdout = await runBin(['--json', '--excludePackages', excludedPackages.join(';')]);

		var packages = Object.keys(JSON.parse(stdout));
		excludedPackages.forEach(pkg => {
			expect(packages).not.toContain(pkg);
		});
	});

	it('should exclude packages starting with', async () => {
		const excludedPackages = ['@types', 'spdx'];
		const stdout = await runBin(['--json', '--excludePackagesStartingWith', excludedPackages.join(';')]);

		const packages = Object.keys(JSON.parse(stdout));

		let illegalPackageFound = false;

		// Loop through all packages and check if they start with one of the excluded packages
		packages.forEach(p => {
			excludedPackages.forEach(excludedPackage => {
				if (p.startsWith(excludedPackage)) {
					illegalPackageFound = true;
				}
			});
		});

		// If an illegal package was found, the test fails
		expect(illegalPackageFound).toBe(false);
	});

	it('should combine various types of inclusion and exclusions', async () => {
		const excludedPrefix = ['@types', 'spdx'];
		const excludedNames = ['rimraf'];
		const stdout = await runBin([
			'--json',
			'--excludePackages',
			excludedNames.join(';'),
			'--excludePackagesStartingWith',
			excludedPrefix.join(';'),
		]);

		const packages = Object.keys(JSON.parse(stdout));

		let illegalPackageFound = false;

		packages.forEach(p => {
			excludedNames.forEach(pkgName => {
				if (pkgName.indexOf('@') > 1) {
					// check for the exact version
					if (p === pkgName) {
						illegalPackageFound = true;
					}
				} else if (p.startsWith(`${pkgName}@`)) {
					illegalPackageFound = true;
				}
			});
			excludedPrefix.forEach(prefix => {
				if (p.startsWith(prefix)) {
					illegalPackageFound = true;
				}
			});
		});

		// If an illegal package was found, the test fails
		expect(illegalPackageFound).toBe(false);
	});

	it('should exclude private packages from the output', async () => {
		const stdout = await runBin(['--json', '--excludePrivatePackages'], {
			cwd: path.join(__dirname, 'fixtures', 'privateModule'),
		});

		var packages = Object.keys(JSON.parse(stdout));
		expect(packages).toHaveLength(0);
	});
}, /* timeout */ 8000);
