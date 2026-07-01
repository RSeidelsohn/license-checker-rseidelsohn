import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runBin } from './test-helpers';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

describe('bin/license-checker-rseidelsohn', () => {
	it('should restrict the output to the provided packages', async () => {
		const includedPackages = ['@types/node@24.13.2'];
		const { code, stderr, stdout } = await runBin(['--json', '--includePackages', includedPackages.join(';')]);

		expect(code).toBe(0);
		expect(stderr).toBe('');
		expect(Object.keys(JSON.parse(stdout))).toEqual(includedPackages);
	}, 15e3); // this test sometimes takes a while

	it('should exclude provided excludedPackages from the output', async () => {
		const excludedPackages = ['@types/node@24.13.2', 'spdx-satisfies@6.0.0'];
		const { code, stderr, stdout } = await runBin(['--json', '--excludePackages', excludedPackages.join(';')]);
		const packages = Object.keys(JSON.parse(stdout));

		expect(code).toBe(0);
		expect(stderr).toBe('');
		excludedPackages.forEach(pkg => {
			expect(packages).not.toContain(pkg);
		});
	});

	it('should exclude packages starting with', async () => {
		const excludedPackages = ['@types', 'spdx'];
		const { code, stderr, stdout } = await runBin([
			'--json',
			'--excludePackagesStartingWith',
			excludedPackages.join(';'),
		]);

		const packages = Object.keys(JSON.parse(stdout));

		let illegalPackageFound = false;

		packages.forEach(pkg => {
			excludedPackages.forEach(excludedPackage => {
				if (pkg.startsWith(excludedPackage)) {
					illegalPackageFound = true;
				}
			});
		});

		expect(code).toBe(0);
		expect(stderr).toBe('');
		expect(illegalPackageFound).toBe(false);
	});

	it('should combine various types of inclusion and exclusions', async () => {
		const excludedPrefix = ['@types', 'spdx'];
		const excludedNames = ['rimraf'];
		const { code, stderr, stdout } = await runBin([
			'--json',
			'--excludePackages',
			excludedNames.join(';'),
			'--excludePackagesStartingWith',
			excludedPrefix.join(';'),
		]);

		const packages = Object.keys(JSON.parse(stdout));

		let illegalPackageFound = false;

		packages.forEach(pkg => {
			excludedNames.forEach(pkgName => {
				if (pkgName.indexOf('@') > 1) {
					if (pkg === pkgName) {
						illegalPackageFound = true;
					}
				} else if (pkg.startsWith(`${pkgName}@`)) {
					illegalPackageFound = true;
				}
			});
			excludedPrefix.forEach(prefix => {
				if (pkg.startsWith(prefix)) {
					illegalPackageFound = true;
				}
			});
		});

		expect(code).toBe(0);
		expect(stderr).toBe('');
		expect(illegalPackageFound).toBe(false);
	});

	it('should exclude private packages from the output', async () => {
		const { code, stderr, stdout } = await runBin(['--json', '--excludePrivatePackages'], {
			cwd: path.join(__dirname, 'fixtures', 'privateModule'),
		});
		const packages = Object.keys(JSON.parse(stdout));

		expect(code).toBe(0);
		expect(stderr).toBe('');
		expect(packages).toHaveLength(0);
	});
}, /* timeout */ 8000);
