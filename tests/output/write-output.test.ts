import { readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { rimraf } from 'rimraf';
import { describe, expect, it, vi } from 'vitest';
import { writeIndividualLicenseFilesToDir } from '../../lib/output/write-output.js';

const licensePath = path.resolve(import.meta.dirname, '../..', 'LICENSE');

describe('writeIndividualLicenseFilesToDir', () => {
	it('should write the license file and warn about missing ones', async () => {
		let warnOutput = '';
		vi.spyOn(console, 'warn').mockImplementation(arg => {
			warnOutput += arg;
		});

		const out = path.join(tmpdir(), 'lc');
		await writeIndividualLicenseFilesToDir(out, {
			foo: { licenses: 'MIT', repository: '/path/to/foo', licenseFile: licensePath },
			bar: { licenses: 'MIT' },
		});
		const [licenseFile] = await readdir(out);
		expect(licenseFile).toBe('foo-LICENSE.txt');
		expect(warnOutput).toContain("No license file found for module 'bar'");
		await rimraf(out);
	});

	it('should create directories for scoped package license files', async () => {
		const out = path.join(tmpdir(), 'lc-scoped');
		await writeIndividualLicenseFilesToDir(out, {
			'@scope/foo@1.0.0': { licenses: 'MIT', repository: '/path/to/foo', licenseFile: licensePath },
		});

		const [licenseFile] = await readdir(path.join(out, '@scope'));
		expect(licenseFile).toBe('foo@1.0.0-LICENSE.txt');
		await rimraf(out);
	});
});
