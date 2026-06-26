import fs from 'node:fs';
import path from 'node:path';
import { supportsColor } from 'chalk';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as args from '../lib/args.js';
import { runLicenseCheck } from '../lib/index.js';
import { getPackageKey } from './test-helpers.ts';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const isSameOrChildPath = (rootPath, currentPath) => {
	const relativePath = path.relative(rootPath, currentPath);
	return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
};

describe('should write output to files in programmatic usage', () => {
	const tmpFileName = path.join(__dirname, 'tmp_output.json');

	beforeAll(async () => {
		await runLicenseCheck({
			start: path.join(__dirname, '../'),
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

function parseAndExclude(parsePath, licenses, result) {
	return async () => {
		result.output = await runLicenseCheck({
			start: path.join(__dirname, parsePath),
			excludeLicenses: licenses,
		});
	};
}

describe('should parse local with unknown and excludes', () => {
	const result = {};

	beforeAll(parseAndExclude('../', 'MIT, ISC', result));

	it('should exclude MIT and ISC licensed modules from results', () => {
		let excluded = true;
		const output = result.output;
		Object.keys(output).forEach(item => {
			if (output[item].licenses && (output[item].licenses === 'MIT' || output[item].licenses === 'ISC')) {
				excluded = false;
			}
		});
		expect(excluded).toBe(true);
	});
});

describe('should parse local with excludes containing commas', () => {
	const result = {};
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
	const result = {};
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
	const result = {};
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
	const result = {};
	beforeAll(parseAndExclude('./fixtures/custom-license-file', 'MIT', result));

	it('should exclude Public Domain', () => {
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

function parseAndFailOn(key, parsePath, licenses, result) {
	return async () => {
		const config = { start: path.join(__dirname, parsePath) };
		config[key] = licenses;

		try {
			result.output = await runLicenseCheck(config);
			result.error = null;
		} catch (error) {
			result.output = {};
			result.error = error;
		}
	};
}

describe('should reject on given list of onlyAllow licenses', () => {
	const result = {};
	beforeAll(parseAndFailOn('onlyAllow', '../', 'MIT; ISC', result));

	it('should reject on non MIT and ISC licensed modules from results', () => {
		expect(result.error.message).toMatch(/which is not permitted by the --onlyAllow flag\. Exiting\./);
	});
});

describe('should reject on single onlyAllow license', () => {
	const result = {};
	beforeAll(parseAndFailOn('onlyAllow', '../', 'ISC', result));

	it('should reject on non ISC licensed modules from results', () => {
		expect(result.error.message).toMatch(/which is not permitted by the --onlyAllow flag\. Exiting\./);
	});
});

describe('should not reject on complete list', () => {
	const result = {};
	beforeAll(
		parseAndFailOn(
			'onlyAllow',
			'../',
			'MIT;ISC;MIT;BSD-3-Clause;BSD;Apache-2.0;' +
				'BSD-2-Clause;Apache*;BSD*;CC-BY-3.0;CC-BY-4.0;Unlicense;CC0-1.0;The MIT License;AFLv2.1,BSD;' +
				'Public Domain;Custom: http://i.imgur.com/goJdO.png;WTFPL*;Apache License, Version 2.0;' +
				'WTFPL;(MIT AND CC-BY-3.0);Custom: https://github.com/substack/node-browserify;' +
				'(AFL-2.1 OR BSD-3-Clause);MIT*;0BSD;(MIT OR CC0-1.0);Apache-2.0*;' +
				'BSD-3-Clause OR MIT;(WTFPL OR MIT);Python-2.0;BlueOak-1.0.0;MPL-2.0',
			result
		)
	);

	it('should not reject if list is complete', () => {
		expect(result.error).toBeNull();
		expect(Object.keys(result.output).length).toBeGreaterThan(0);
	});
});

describe('should reject on given list of failOn licenses', () => {
	const result = {};
	beforeAll(parseAndFailOn('failOn', '../', 'MIT; ISC', result));

	it('should reject on MIT and ISC licensed modules from results', () => {
		expect(result.error.message).toMatch(/Found license defined by the --failOn flag: "MIT"\. Exiting\./);
	});
});

describe('should reject on single failOn license', () => {
	const result = {};
	beforeAll(parseAndFailOn('failOn', '../', 'ISC', result));

	it('should reject on ISC licensed modules from results', () => {
		expect(result.error.message).toMatch(/Found license defined by the --failOn flag: "ISC"\. Exiting\./);
	});
});

describe('init policy errors', () => {
	it('returns onlyAllow errors through the callback without exiting', async () => {
		const options = { start: path.join(__dirname, '../'), onlyAllow: 'ISC' };
		await expect(runLicenseCheck(options)).rejects.toThrow(
			/which is not permitted by the --onlyAllow flag\. Exiting\./
		);
	});

	it('returns failOn errors through the callback without exiting', async () => {
		const options = { start: path.join(__dirname, '../'), failOn: 'ISC' };
		await expect(runLicenseCheck(options)).rejects.toThrow(
			/Found license defined by the --failOn flag: "ISC"\. Exiting\./
		);
	});
});

describe('should parse local and handle private modules', () => {
	let output;
	beforeAll(async () => {
		output = await runLicenseCheck({
			start: path.join(__dirname, './fixtures/privateModule'),
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
	it('should recognise a custom license at a url', async () => {
		const output = await runLicenseCheck({
			start: path.join(__dirname, './fixtures/license-file-only'),
		});
		const item = output[Object.keys(output)[0]];
		expect(item.licenses).toBe('MIT*');
	});
});

describe('should treat URLs as custom licenses', () => {
	let output;
	beforeAll(async () => {
		output = await runLicenseCheck({
			start: path.join(__dirname, './fixtures/custom-license-url'),
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
	let output;
	beforeAll(async () => {
		output = await runLicenseCheck({
			start: path.join(__dirname, './fixtures/custom-license-file'),
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

describe('error handler', () => {
	it('should run without errors', async () => {
		await expect(runLicenseCheck({ start: path.join(__dirname, '../'), development: true })).resolves.not.toThrow();
	});

	it('should run with errors (npm packages not found)', async () => {
		await expect(runLicenseCheck({ start: 'C:\\' })).rejects.toThrow();
	});
});

describe('should parse with args', () => {
	it('should handle undefined', () => {
		const result = args.setDefaultArguments(undefined);
		expect(result.color).toBe(supportsColor ? supportsColor.hasBasic : false);
		expect(result.start).toBe(path.resolve(path.join(__dirname, '../')));
	});

	it('should handle color undefined', () => {
		const result = args.setDefaultArguments({
			color: undefined,
			start: path.resolve(path.join(__dirname, '../')),
		});
		expect(result.color).toBe(supportsColor ? supportsColor.hasBasic : false);
		expect(result.start).toBe(path.resolve(path.join(__dirname, '../')));
	});

	it('should handle direct undefined', () => {
		const result = args.setDefaultArguments({
			direct: undefined,
			start: path.resolve(path.join(__dirname, '../')),
		});
		expect(result.direct).toBe(Number.POSITIVE_INFINITY);
		expect(result.start).toBe(path.resolve(path.join(__dirname, '../')));
	});

	it('should handle direct true', () => {
		const result = args.setDefaultArguments({ direct: true, start: path.resolve(path.join(__dirname, '../')) });
		expect(result.direct).toBe(Number.POSITIVE_INFINITY);
		expect(result.start).toBe(path.resolve(path.join(__dirname, '../')));
	});

	it('should override direct option with depth option', () => {
		const result = args.setDefaultArguments({
			direct: '9',
			depth: '99',
			start: path.resolve(path.join(__dirname, '../')),
		});
		expect(result.direct).toBe(99);
		expect(result.start).toBe(path.resolve(path.join(__dirname, '../')));
	});

	it('should use depth for direct option when direct is not provided', () => {
		const result = args.setDefaultArguments({ depth: '99', start: path.resolve(path.join(__dirname, '../')) });
		expect(result.direct).toBe(99);
		expect(result.start).toBe(path.resolve(path.join(__dirname, '../')));
	});

	['json', 'markdown', 'csv', 'summary'].forEach(type => {
		it(`should disable color on ${type}`, () => {
			const def = {
				color: undefined,
				start: path.resolve(path.join(__dirname, '../')),
			};
			def[type] = true;
			const result = args.setDefaultArguments(def);
			expect(result.start).toBe(path.resolve(path.join(__dirname, '../')));
		});
	});
});

describe('custom formats', () => {
	it('should create a custom format using customFormat successfully', async () => {
		const output = await runLicenseCheck({
			start: path.join(__dirname, '../'),
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
		process.argv.push('--customPath');
		process.argv.push('./customFormatExample.json');

		const parsed = args.getNormalizedArguments();
		parsed.start = path.join(__dirname, '../');

		process.argv.pop();
		process.argv.pop();

		const filtered = await runLicenseCheck(parsed);
		const customFormatContent = fs.readFileSync(path.join(__dirname, './../customFormatExample.json'), 'utf8');

		expect(customFormatContent).not.toBeUndefined();
		expect(customFormatContent).not.toBeNull();

		const customJson = JSON.parse(customFormatContent);

		//Test dynamically with the file directly
		Object.keys(filtered).forEach(licenseItem => {
			Object.keys(customJson).forEach(definedItem => {
				expect(filtered[licenseItem][definedItem]).not.toBe('undefined');
			});
		});
	});

	it('should return data for keys with different names in json vs custom format', async () => {
		const filtered = await runLicenseCheck({
			start: path.join(__dirname, './fixtures/author'),
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
			start: path.join(__dirname, '../'),
		});

		Object.keys(output).forEach(key => {
			const expectedPath = path.resolve(path.join(__dirname, '../'));
			expect(isSameOrChildPath(expectedPath, output[key].path)).toBe(true);
		});
	});

	it('using only relative paths if the option relativeModulePath is being used', async () => {
		const output = await runLicenseCheck({
			start: path.join(__dirname, '../'),
			relativeModulePath: true,
		});
		const rootPath = path.join(__dirname, '../');

		Object.keys(output).forEach(key => {
			const outputPath = output[key].path;
			expect(outputPath.startsWith(rootPath)).toBe(false);
		});
	});
});

describe('should output the location of the license files', () => {
	it('as absolute paths', async () => {
		const output = await runLicenseCheck({
			start: path.join(__dirname, '../'),
		});

		Object.keys(output)
			.map(key => output[key])
			.filter(dep => dep.licenseFile !== undefined)
			.forEach(dep => {
				const expectedPath = path.resolve(path.join(__dirname, '../'));
				expect(isSameOrChildPath(expectedPath, dep.licenseFile)).toBe(true);
			});
	});

	it('as relative paths when using relativeLicensePath', async () => {
		const filtered = await runLicenseCheck({
			start: path.join(__dirname, '../'),
			relativeLicensePath: true,
		});

		Object.keys(filtered)
			.map(key => filtered[key])
			.filter(dep => dep.licenseFile !== undefined)
			.forEach(dep => {
				expect(dep.licenseFile.substr(0, 1)).not.toBe('/');
			});
	});
});

describe('handle copytight statement', () => {
	it('should output copyright statements when configured in custom format', async () => {
		const output = await runLicenseCheck({
			start: path.join(__dirname, '../'),
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
		start: path.join(__dirname, './fixtures/license-file-only'),
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

function parseAndInclude(parsePath, licenses, result) {
	return async () => {
		result.output = await runLicenseCheck({
			start: path.join(__dirname, parsePath),
			includeLicenses: licenses,
		});
	};
}

describe('should list given packages', () => {
	const result = {};
	beforeAll(parseAndInclude('./fixtures/includeBSD', 'BSD', result));

	it('should include only BSD', () => {
		const output = result.output;
		expect(Object.keys(output)).toHaveLength(1);
	});
});

describe('should not list not given packages', () => {
	const result = {};
	beforeAll(parseAndInclude('./fixtures/includeApache', 'BSD', result));

	it('should not include Apache', () => {
		const output = result.output;
		expect(Object.keys(output)).toHaveLength(0);
	});
});

describe('should only list UNKNOWN or guessed licenses with errors (argument missing)', () => {
	let output;
	beforeAll(async () => {
		output = await runLicenseCheck({
			start: path.join(__dirname, '../'),
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
