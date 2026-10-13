import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { collectLicenseResults } from '../../lib/licenses/collect-license-results.js';

const collect = (rootPackage: Record<string, unknown>, options: Record<string, unknown> = {}) =>
	collectLicenseResults({
		clarifications: {},
		rootPackage,
		...options,
	});

describe('collectLicenseResults', () => {
	it('collects license info while respecting dependency depth', () => {
		const rootPackage = {
			name: 'root',
			version: '1.0.0',
			license: 'MIT',
			root: true,
			dependencies: {
				direct: {
					name: 'direct',
					version: '1.0.0',
					license: 'Apache-2.0',
					dependencies: {
						transitive: {
							name: 'transitive',
							version: '1.0.0',
							license: 'ISC',
						},
					},
				},
			},
		};

		const result = collect(rootPackage, { direct: 0 });

		expect(result['root@1.0.0'].licenses).toBe('MIT');
		expect(result['direct@1.0.0'].licenses).toBe('Apache-2.0');
		expect(result['transitive@1.0.0']).toBeUndefined();
	});

	it('uses clarifications and marks matching entries as used', () => {
		const clarification: { licenses: string; semverRange: string; used?: boolean } = {
			licenses: 'ISC',
			semverRange: '1.0.0',
		};
		const rootPackage = {
			name: 'root',
			version: '1.0.0',
			license: 'MIT',
			root: true,
			dependencies: {
				direct: {
					name: 'direct',
					version: '1.0.0',
					license: 'Apache-2.0',
				},
			},
		};

		const result = collect(rootPackage, {
			clarifications: {
				direct: [clarification],
			},
		});

		expect(result['direct@1.0.0'].licenses).toBe('ISC');
		expect(clarification.used).toBe(true);
	});

	it('uses canonical SPDX text instead of a README when license text is required', () => {
		const packagePath = fs.mkdtempSync(path.join(tmpdir(), 'license-checker-spdx-'));
		fs.writeFileSync(path.join(packagePath, 'README.md'), '# Example package');

		try {
			const result = collect(
				{
					name: 'root',
					version: '1.0.0',
					license: 'MIT',
					path: packagePath,
					root: true,
				},
				{ args: { plainVertical: true } }
			);

			expect(result['root@1.0.0'].licenseFile).toBeUndefined();
			expect(result['root@1.0.0'].licenseText).toContain('MIT License');
			expect(result['root@1.0.0'].licenseText).toContain('Permission is hereby granted');
		} finally {
			fs.rmSync(packagePath, { recursive: true, force: true });
		}
	});

	it('uses canonical SPDX text when no candidate license file exists', () => {
		const packagePath = fs.mkdtempSync(path.join(tmpdir(), 'license-checker-empty-'));

		try {
			const result = collect(
				{
					name: 'root',
					version: '1.0.0',
					license: 'Apache-2.0',
					path: packagePath,
					root: true,
				},
				{ args: { files: 'licenses' } }
			);

			expect(result['root@1.0.0'].licenseFile).toBeUndefined();
			expect(result['root@1.0.0'].licenseText).toContain('Apache License');
		} finally {
			fs.rmSync(packagePath, { recursive: true, force: true });
		}
	});

	it('keeps a package-provided license file ahead of canonical SPDX text', () => {
		const packagePath = fs.mkdtempSync(path.join(tmpdir(), 'license-checker-file-'));
		fs.writeFileSync(path.join(packagePath, 'LICENSE'), 'Package-specific license text');
		fs.writeFileSync(path.join(packagePath, 'README.md'), '# Example package');

		try {
			const result = collect(
				{
					name: 'root',
					version: '1.0.0',
					license: 'MIT',
					path: packagePath,
					root: true,
				},
				{ args: { plainVertical: true } }
			);

			expect(result['root@1.0.0'].licenseFile).toBe(path.join(packagePath, 'LICENSE'));
			expect(result['root@1.0.0'].licenseText).toBeUndefined();
		} finally {
			fs.rmSync(packagePath, { recursive: true, force: true });
		}
	});
});
