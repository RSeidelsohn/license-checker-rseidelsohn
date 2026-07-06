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
});
