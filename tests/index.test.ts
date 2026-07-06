import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { runLicenseCheck } from '../lib';
import { getPackageKey } from './test-helpers';

type LicenseCheckItem = {
	copyright?: string;
	description?: string;
	licenseFile?: string;
	licenses?: string | string[];
	name?: string;
	path?: string;
	pewpew?: string;
	publisher?: string;
	[key: string]: unknown;
};

type LicenseCheckOutput = Awaited<ReturnType<typeof runLicenseCheck>>;

type OutputResult = {
	output: LicenseCheckOutput;
};

type PackageJson = Record<string, unknown>;

const repoPath = path.resolve(import.meta.dirname, '..');
const fixturesPath = path.join(import.meta.dirname, 'fixtures');
const clarificationsPath = path.join(fixturesPath, 'clarifications');
const clarificationExamplePath = path.join(import.meta.dirname, '../clarificationExample.json');
const customFormatExamplePath = path.join(repoPath, 'customFormatExample.json');
const resolveTestPath = (relativePath: string) => path.resolve(import.meta.dirname, relativePath);

const isSameOrChildPath = (rootPath: string, currentPath: string | undefined) => {
	if (!currentPath) {
		return false;
	}
	const relativePath = path.relative(rootPath, currentPath);
	return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
};

const hasLicenseFile = (dep: LicenseCheckItem): dep is LicenseCheckItem & { licenseFile: string } =>
	dep.licenseFile !== undefined;

const createTempDirectory = () => fs.mkdtempSync(path.join(fs.realpathSync(tmpdir()), 'license-checker-'));

const writePackage = (directory: string, packageJson: PackageJson) => {
	fs.mkdirSync(directory, { recursive: true });
	fs.writeFileSync(path.join(directory, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);
};

const createDependencyModeFixture = () => {
	const root = createTempDirectory();

	writePackage(root, {
		name: 'fixture-root',
		version: '1.0.0',
		license: 'MIT',
		dependencies: {
			'@scope/scoped': '1.0.0',
			missingRequired: '1.0.0',
			prod: '1.0.0',
		},
		devDependencies: {
			dev: '1.0.0',
		},
		optionalDependencies: {
			missingOptional: '1.0.0',
		},
		peerDependencies: {
			peer: '1.0.0',
		},
	});

	writePackage(path.join(root, 'node_modules/prod'), {
		name: 'prod',
		version: '1.0.0',
		license: 'MIT',
		dependencies: {
			transitive: '1.0.0',
		},
	});
	writePackage(path.join(root, 'node_modules/transitive'), {
		name: 'transitive',
		version: '1.0.0',
		license: 'Apache-2.0',
	});
	writePackage(path.join(root, 'node_modules/dev'), {
		name: 'dev',
		version: '1.0.0',
		license: 'ISC',
	});
	writePackage(path.join(root, 'node_modules/peer'), {
		name: 'peer',
		version: '1.0.0',
		license: 'BSD-3-Clause',
	});
	writePackage(path.join(root, 'node_modules/@scope/scoped'), {
		name: '@scope/scoped',
		version: '1.0.0',
		license: '0BSD',
	});

	return root;
};

describe('runLicenseCheck', () => {
	it('should parse with unknown', async () => {
		const output = await runLicenseCheck({
			start: repoPath,
			unknown: true,
		});
		expect(Object.keys(output).length).toBeGreaterThan(20);
	});
});

describe('runLicenseCheck with Arborist dependency trees', () => {
	let root: string;

	beforeEach(() => {
		root = createDependencyModeFixture();
	});

	afterEach(() => {
		fs.rmSync(root, { force: true, recursive: true });
	});

	it('includes production and development dependencies by default', async () => {
		const output = await runLicenseCheck({ start: root });

		expect(output['prod@1.0.0']).toBeDefined();
		expect(output['transitive@1.0.0']).toBeDefined();
		expect(output['dev@1.0.0']).toBeDefined();
		expect(output['peer@1.0.0']).toBeDefined();
		expect(output['@scope/scoped@1.0.0']).toBeDefined();
	});

	it('includes publisher from normalized author data without requiring custom format', async () => {
		writePackage(path.join(root, 'node_modules/prod'), {
			name: 'prod',
			version: '1.0.0',
			license: 'MIT',
			author: 'Jane Doe <jane@example.com>',
		});

		const output = await runLicenseCheck({ json: true, start: root });

		expect(output['prod@1.0.0'].publisher).toBe('Jane Doe');
		expect(output['prod@1.0.0'].email).toBe('jane@example.com');
	});

	it('excludes dev-only dependencies in production mode', async () => {
		const output = await runLicenseCheck({ production: true, start: root });

		expect(output['prod@1.0.0']).toBeDefined();
		expect(output['transitive@1.0.0']).toBeDefined();
		expect(output['dev@1.0.0']).toBeUndefined();
	});

	it('includes dev-only dependencies and excludes production-only dependencies in development mode', async () => {
		const output = await runLicenseCheck({ development: true, start: root });

		expect(output['fixture-root@1.0.0']).toBeDefined();
		expect(output['dev@1.0.0']).toBeDefined();
		expect(output['prod@1.0.0']).toBeUndefined();
		expect(output['transitive@1.0.0']).toBeUndefined();
		expect(output['@scope/scoped@1.0.0']).toBeUndefined();
	});

	it('keeps only root and direct dependencies at depth 0', async () => {
		const output = await runLicenseCheck({ direct: 0, start: root });

		expect(output['fixture-root@1.0.0']).toBeDefined();
		expect(output['prod@1.0.0']).toBeDefined();
		expect(output['dev@1.0.0']).toBeDefined();
		expect(output['peer@1.0.0']).toBeDefined();
		expect(output['@scope/scoped@1.0.0']).toBeDefined();
		expect(output['transitive@1.0.0']).toBeUndefined();
	});

	it('omits peer dependencies when nopeer is set', async () => {
		const output = await runLicenseCheck({ nopeer: true, start: root });

		expect(output['peer@1.0.0']).toBeUndefined();
		expect(output['prod@1.0.0']).toBeDefined();
	});

	it('ignores missing optional dependencies and does not crash on missing required dependencies', async () => {
		const output = await runLicenseCheck({ start: root });

		expect(output['missingOptional@1.0.0']).toBeUndefined();
		expect(output['missingRequired@1.0.0']).toBeUndefined();
		expect(output['fixture-root@1.0.0']).toBeDefined();
	});

	it('rejects dependency tree read errors', async () => {
		await expect(runLicenseCheck({ start: path.join(root, 'does-not-exist') })).rejects.toBeInstanceOf(Error);
	});
});

describe('runLicenseCheck with clarifications', () => {
	const result: { output: LicenseCheckOutput } = { output: {} };

	beforeAll(async () => {
		result.output = await runLicenseCheck({
			start: clarificationsPath,
			clarificationsFile: clarificationExamplePath,
			customFormat: { licenses: '', publisher: '', email: '', path: '', licenseFile: '', licenseText: '' },
		});
	});

	it('should replace existing license', () => {
		const output = result.output['license-checker-rseidelsohn@0.0.0'];

		expect(output.licenseText).toBe('Some mild rephrasing of an MIT license');
		expect(output.licenses).toBe('MIT');
	});

	it('should reject if the checksum does not match', async () => {
		await expect(
			runLicenseCheck({
				start: clarificationsPath,
				clarificationsFile: path.join(clarificationsPath, 'mismatch/clarification.json'),
			})
		).rejects.toThrow(/Clarification checksum mismatch/);
	});

	it('should reject if a checksum clarification cannot be checked against a license file', async () => {
		await expect(
			runLicenseCheck({
				start: path.join(fixturesPath, 'noLicenseFile'),
				clarificationsFile: path.join(clarificationsPath, 'checksumWithoutLicenseFile.json'),
			})
		).rejects.toThrow(/All clarifications must come with a checksum/);
	});

	it('should reject if clarificationsMatchAll leaves unused clarifications', async () => {
		await expect(
			runLicenseCheck({
				start: clarificationsPath,
				clarificationsFile: path.join(clarificationsPath, 'unusedClarification.json'),
				clarificationsMatchAll: true,
			})
		).rejects.toThrow(
			/Some clarifications \(unused-package@1\.0\.0\) were unused and --clarificationsMatchAll was specified\. Exiting\./
		);
	});
});

describe('should write output to files in programmatic usage', () => {
	const tmpFileName = path.join(import.meta.dirname, 'tmp_output.json');

	beforeAll(async () => {
		await runLicenseCheck({
			start: repoPath,
			json: true,
			out: tmpFileName,
		});
	});

	afterAll(() => {
		if (fs.existsSync(tmpFileName)) {
			fs.unlinkSync(tmpFileName);
		}
	});

	it('and the file should contain parseable JSON', () => {
		expect(fs.existsSync(tmpFileName)).toBe(true);

		const outputTxt = fs.readFileSync(tmpFileName, 'utf8');
		const outputJson = JSON.parse(outputTxt);

		expect(typeof outputJson).toBe('object');
	});
});

function parseAndExclude(parsePath: string, licenses: string, result: OutputResult) {
	return async () => {
		result.output = await runLicenseCheck({
			start: resolveTestPath(parsePath),
			excludeLicenses: licenses,
		});
	};
}

describe('should parse local with excludes containing commas', () => {
	const result: OutputResult = { output: {} };
	beforeAll(parseAndExclude('./fixtures/excludeWithComma', 'Apache License\\, Version 2.0', result));

	it('should exclude a license with a comma from the list', () => {
		let excluded = true;
		const output = result.output;
		Object.keys(output).forEach(item => {
			if (output[item].licenses && output[item].licenses === 'Apache License, Version 2.0') {
				excluded = false;
			}
		});
		expect(excluded).toBe(true);
	});
});

describe('should parse local with BSD excludes', () => {
	const result: OutputResult = { output: {} };
	beforeAll(parseAndExclude('./fixtures/excludeBSD', 'BSD', result));

	it('should exclude BSD-3-Clause', () => {
		let excluded = true;
		const output = result.output;
		Object.keys(output).forEach(item => {
			if (output[item].licenses && output[item].licenses === 'BSD-3-Clause') {
				excluded = false;
			}
		});
		expect(excluded).toBe(true);
	});
});

describe('should parse local with Public Domain excludes', () => {
	const result: OutputResult = { output: {} };
	beforeAll(parseAndExclude('./fixtures/excludePublicDomain', 'Public Domain', result));

	it('should exclude Public Domain', () => {
		let excluded = true;
		const output = result.output;
		Object.keys(output).forEach(item => {
			if (output[item].licenses && output[item].licenses === 'Public Domain') {
				excluded = false;
			}
		});
		expect(excluded).toBe(true);
	});
});

describe('should not exclude Custom if not specified in excludes', () => {
	const result: OutputResult = { output: {} };
	beforeAll(parseAndExclude('./fixtures/custom-license-file', 'MIT', result));

	it('should not exclude custom licenses when only MIT is excluded', () => {
		let excluded = true;
		const output = result.output;
		Object.keys(output).forEach(item => {
			if (output[item].licenses && output[item].licenses === 'Custom: MY-LICENSE.md') {
				excluded = false;
			}
		});
		expect(excluded).toBe(false);
	});
});

describe('init policy errors', () => {
	it('returns onlyAllow errors through the callback without exiting', async () => {
		const options = { start: repoPath, onlyAllow: 'ISC' };
		await expect(runLicenseCheck(options)).rejects.toThrow(
			/which is not permitted by the --onlyAllow flag\. Exiting\./
		);
	});

	it('returns failOn errors through the callback without exiting', async () => {
		const options = { start: repoPath, failOn: 'ISC' };
		await expect(runLicenseCheck(options)).rejects.toThrow(
			/Found license defined by the --failOn flag: "ISC"\. Exiting\./
		);
	});
});

describe('should parse local and handle private modules', () => {
	let output: LicenseCheckOutput;
	beforeAll(async () => {
		output = await runLicenseCheck({
			start: path.join(fixturesPath, 'privateModule'),
		});
	});

	it('should recognise private modules', () => {
		let privateModule = false;

		Object.keys(output).forEach(item => {
			if (output[item].licenses && output[item].licenses.indexOf('UNLICENSED') >= 0) {
				privateModule = true;
			}
		});

		expect(privateModule).toBe(true);
	});
});

describe('should treat license file over custom urls', () => {
	it('should detect a license from an unreferenced license file', async () => {
		const output = await runLicenseCheck({
			start: path.join(fixturesPath, 'license-file-only'),
		});
		const item = output[Object.keys(output)[0]];
		expect(item.licenses).toBe('MIT*');
	});
});

describe('should treat URLs as custom licenses', () => {
	let output: LicenseCheckOutput;
	beforeAll(async () => {
		output = await runLicenseCheck({
			start: path.join(fixturesPath, 'custom-license-url'),
		});
	});

	it('should recognise a custom license at a url', () => {
		let foundCustomLicense = false;
		Object.keys(output).forEach(item => {
			if (output[item].licenses && output[item].licenses === 'Custom: http://example.com/dummy-license') {
				foundCustomLicense = true;
			}
		});
		expect(foundCustomLicense).toBe(true);
	});
});

describe('should treat file references as custom licenses', () => {
	let output: LicenseCheckOutput;
	beforeAll(async () => {
		output = await runLicenseCheck({
			start: path.join(fixturesPath, 'custom-license-file'),
		});
	});

	it('should recognise a custom license in a file', () => {
		let foundCustomLicense = false;
		Object.keys(output).forEach(item => {
			if (output[item].licenses && output[item].licenses === 'Custom: MY-LICENSE.md') {
				foundCustomLicense = true;
			}
		});
		expect(foundCustomLicense).toBe(true);
	});
});

describe('custom formats', () => {
	it('should create a custom format using customFormat successfully', async () => {
		const output = await runLicenseCheck({
			start: repoPath,
			customFormat: {
				name: '<<Default Name>>',
				description: '<<Default Description>>',
				pewpew: '<<Should Never be set>>',
			},
		});

		Object.keys(output).forEach(item => {
			expect(output[item].name).not.toBeUndefined();
			expect(output[item].description).not.toBeUndefined();
			expect(output[item].pewpew).not.toBeUndefined();
			expect(output[item].pewpew).toBe('<<Should Never be set>>');
		});
	});

	it('should create a custom format using customPath', async () => {
		const filtered = await runLicenseCheck({ customPath: customFormatExamplePath, start: repoPath });
		const customFormatContent = fs.readFileSync(customFormatExamplePath, 'utf8');

		expect(customFormatContent).not.toBeUndefined();
		expect(customFormatContent).not.toBeNull();

		const customJson = JSON.parse(customFormatContent);

		// Test dynamically with the file directly
		Object.keys(filtered).forEach(licenseItem => {
			Object.keys(customJson).forEach(definedItem => {
				expect(filtered[licenseItem][definedItem]).not.toBe('undefined');
			});
		});
	});

	it('should return data for keys with different names in json vs custom format', async () => {
		const filtered = await runLicenseCheck({
			start: path.join(fixturesPath, 'author'),
			customFormat: {
				publisher: '',
			},
		});

		expect(Object.keys(filtered)).toHaveLength(1);
		expect(filtered['license-checker-rseidelsohn@0.0.0'].publisher).toBe('Roman Seidelsohn');
	});
});

describe('should output the module location', () => {
	it('as absolute path', async () => {
		const output = await runLicenseCheck({
			start: repoPath,
		});

		Object.keys(output).forEach(key => {
			expect(isSameOrChildPath(repoPath, output[key].path ?? '')).toBe(true);
		});
	});

	it('using only relative paths if the option relativeModulePath is being used', async () => {
		const output = await runLicenseCheck({
			start: repoPath,
			relativeModulePath: true,
		});

		Object.keys(output).forEach(key => {
			const outputPath = output[key].path ?? '';
			expect(outputPath.startsWith(repoPath)).toBe(false);
		});
	});
});

describe('should output the location of the license files', () => {
	it('as absolute paths', async () => {
		const output = await runLicenseCheck({
			start: repoPath,
		});

		Object.keys(output)
			.map(key => output[key])
			.filter(hasLicenseFile)
			.forEach(dep => {
				expect(isSameOrChildPath(repoPath, dep.licenseFile)).toBe(true);
			});
	});

	it('as relative paths when using relativeLicensePath', async () => {
		const filtered = await runLicenseCheck({
			start: repoPath,
			relativeLicensePath: true,
		});

		Object.keys(filtered)
			.map(key => filtered[key])
			.filter(hasLicenseFile)
			.forEach(dep => {
				expect(dep.licenseFile?.substring(0, 1)).not.toBe('/');
			});
	});
});

describe('handle copyright statement', () => {
	it('should output copyright statements when configured in custom format', async () => {
		const output = await runLicenseCheck({
			start: repoPath,
			customFormat: {
				copyright: '', // specify custom format
				email: false,
				licenseFile: false,
				licenseText: false,
				publisher: false,
			},
		});

		const abbrevPackageKey = getPackageKey(output, 'abbrev');
		expect(output[abbrevPackageKey].copyright).toBe('Copyright (c) Isaac Z. Schlueter and Contributors*');
	});
});

it('should only list UNKNOWN or guessed licenses successfully so we check if there is no license with a star or UNKNOWN found', async () => {
	const output = await runLicenseCheck({
		start: path.join(fixturesPath, 'license-file-only'),
		onlyunknown: true,
	});

	let onlyStarsFound = true;
	Object.keys(output).forEach(item => {
		if (output[item].licenses && output[item].licenses.indexOf('UNKNOWN') !== -1) {
			//Okay
		} else if (output[item].licenses && output[item].licenses.indexOf('*') !== -1) {
			//Okay
		} else {
			onlyStarsFound = false;
		}
	});

	expect(onlyStarsFound).toBe(true);
});

function parseAndInclude(parsePath: string, licenses: string, result: OutputResult) {
	return async () => {
		result.output = await runLicenseCheck({
			start: resolveTestPath(parsePath),
			includeLicenses: licenses,
		});
	};
}

describe('should list given packages', () => {
	const result: OutputResult = { output: {} };
	beforeAll(parseAndInclude('./fixtures/includeBSD', 'BSD', result));

	it('should include only BSD', () => {
		const output = result.output;
		expect(Object.keys(output)).toHaveLength(1);
	});
});

describe('should not list not given packages', () => {
	const result: OutputResult = { output: {} };
	beforeAll(parseAndInclude('./fixtures/includeApache', 'BSD', result));

	it('should not include Apache', () => {
		const output = result.output;
		expect(Object.keys(output)).toHaveLength(0);
	});
});

describe('should only list UNKNOWN or guessed licenses with errors (argument missing)', () => {
	let output: LicenseCheckOutput;
	beforeAll(async () => {
		output = await runLicenseCheck({
			start: repoPath,
			production: true,
		});
	});

	it('so we check if there is no license with a star or UNKNOWN found', () => {
		let onlyStarsFound = true;

		Object.keys(output).forEach(item => {
			if (output[item].licenses && output[item].licenses.indexOf('UNKNOWN') !== -1) {
				//Okay
			} else if (output[item].licenses && output[item].licenses.indexOf('*') !== -1) {
				//Okay
			} else {
				onlyStarsFound = false;
			}
		});
		expect(onlyStarsFound).toBe(false);
	});
});
