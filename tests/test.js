import assert from 'node:assert';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { supportsColor } from 'chalk';
import * as rimraf from 'rimraf';
import * as args from '../lib/args.js';
import * as checker from '../lib/index.js';
import pkgJson from '../package.json' with { type: 'json' };

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const initChecker = options =>
	new Promise((resolve, reject) => {
		checker.init(options, (error, output) => {
			if (error) {
				reject(error);
				return;
			}

			resolve(output);
		});
	});

const initCheckerRaw = options =>
	new Promise(resolve => {
		checker.init(options, (error, output) => {
			resolve({ error, output });
		});
	});

const getPackageKey = (output, packageName) => {
	const packageKey = Object.keys(output).find(key => key.startsWith(`${packageName}@`));
	assert.ok(packageKey, `Expected ${packageName} in output`);
	return packageKey;
};

const hasPackage = (output, packageName) => Object.keys(output).some(key => key.startsWith(`${packageName}@`));

const isSameOrChildPath = (rootPath, currentPath) => {
	const relativePath = path.relative(rootPath, currentPath);
	return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
};

describe('main tests', () => {
	it('should load init', () => {
		assert.equal(typeof checker.init, 'function');
	});

	it('should load print', () => {
		assert.equal(typeof checker.print, 'function');
	});

	describe('should parse local with unknown', () => {
		let output;

		beforeAll(async () => {
			output = await initChecker({
				start: path.join(__dirname, '../'),
			});
		}, 5000);

		it('and give us results', () => {
			assert.ok(Object.keys(output).length > 70);
			assert.equal(output[getPackageKey(output, 'abbrev')].licenses, 'ISC');
		});

		it('and convert to CSV', () => {
			const str = checker.asCSV(output);
			const codeFramePackageKey = getPackageKey(output, '@babel/code-frame');
			assert.equal(str.split('\n')[0], '"module name","license","repository"');
			assert.equal(str.split('\n')[1], `"${codeFramePackageKey}","MIT","https://github.com/babel/babel"`);
		});

		it('and convert to MarkDown', () => {
			const str = checker.asMarkDown(output);
			const codeFramePackageKey = getPackageKey(output, '@babel/code-frame');
			assert.equal(str.split('\n')[0], `- [${codeFramePackageKey}](https://github.com/babel/babel) - MIT`);
		});
	});

	describe('should parse local with unknown and custom format', () => {
		let output;

		beforeAll(async () => {
			const format = {
				name: '<<Default Name>>',
				description: '<<Default Description>>',
				pewpew: '<<Should Never be set>>',
			};

			output = await initChecker({
				start: path.join(__dirname, '../'),
				customFormat: format,
			});
		});

		it('and give us results', () => {
			assert.ok(Object.keys(output).length > 70);
			assert.equal(output[getPackageKey(output, 'abbrev')].description, "Like ruby's abbrev module, but in js");
		});

		it('and convert to CSV', () => {
			const format = {
				name: '<<Default Name>>',
				description: '<<Default Description>>',
				pewpew: '<<Should Never be set>>',
			};

			const str = checker.asCSV(output, format);
			const codeFramePackageKey = getPackageKey(output, '@babel/code-frame');
			assert.equal(str.split('\n')[0], '"module name","name","description","pewpew"');
			assert.equal(
				str.split('\n')[1],
				`"${codeFramePackageKey}","@babel/code-frame","Generate errors that contain a code frame that point to source locations.","<<Should Never be set>>"`
			);
		});

		it('and convert to CSV with component prefix', () => {
			const format = {
				name: '<<Default Name>>',
				description: '<<Default Description>>',
				pewpew: '<<Should Never be set>>',
			};

			const str = checker.asCSV(output, format, 'main-module');
			const codeFramePackageKey = getPackageKey(output, '@babel/code-frame');
			assert.equal(str.split('\n')[0], '"component","module name","name","description","pewpew"');
			assert.equal(
				str.split('\n')[1],
				`"main-module","${codeFramePackageKey}","@babel/code-frame","Generate errors that contain a code frame that point to source locations.","<<Should Never be set>>"`
			);
		});

		it('and convert to MarkDown', () => {
			const format = {
				name: '<<Default Name>>',
				description: '<<Default Description>>',
				pewpew: '<<Should Never be set>>',
			};

			const str = checker.asMarkDown(output, format);
			const codeFramePackageKey = getPackageKey(output, '@babel/code-frame');
			assert.equal(str.split('\n')[0], `- **[${codeFramePackageKey}](https://github.com/babel/babel)**`);
		});
	});

	describe('should parse local without unknown', () => {
		let output;

		beforeAll(async () => {
			output = await initChecker({
				start: path.join(__dirname, '../'),
				unknown: true,
			});
		});

		it('should give us results', () => {
			assert.ok(output);
			assert.ok(Object.keys(output).length > 20);
		});
	});

	describe('should parse direct dependencies only', () => {
		let output;

		beforeAll(async () => {
			output = await initChecker({
				start: path.join(__dirname, '../'),
				direct: 0, // 0 is the parsed value passed to init from license-checker-rseidelsohn if set to true
			});
		});

		it('and give us results', () => {
			const pkgDepsNumber =
				Object.keys(pkgJson.dependencies || {}).length +
				Object.keys(pkgJson.devDependencies || {}).length +
				Object.keys(pkgJson.peerDependencies || {}).length;
			// all and only the dependencies listed in the package.json should be included in the output,
			// plus the main module itself
			assert.ok(Object.keys(output).length === pkgDepsNumber + 1);
			assert.equal(hasPackage(output, 'abbrev'), false);
		});
	});

	describe('should write output to files in programmatic usage', () => {
		const tmpFileName = path.join(__dirname, 'tmp_output.json');

		beforeAll(async () => {
			await initChecker({
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
			assert.ok(fs.existsSync(tmpFileName));

			const outputTxt = fs.readFileSync(tmpFileName, 'utf8');
			const outputJson = JSON.parse(outputTxt);

			assert.equal(typeof outputJson, 'object');
		});
	});

	function parseAndExclude(parsePath, licenses, result) {
		return async () => {
			result.output = await initChecker({
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
			assert.ok(excluded);
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
			assert.ok(excluded);
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
			assert.ok(excluded);
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
			assert.ok(excluded);
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
			assert.ok(!excluded);
		});
	});

	function parseAndFailOn(key, parsePath, licenses, result) {
		return async () => {
			let exitCode = 0;
			const originalExit = process.exit;
			process.exit = code => {
				exitCode = code;
			};
			const config = {
				start: path.join(__dirname, parsePath),
			};
			config[key] = licenses;

			try {
				result.output = await initChecker(config);
				result.exitCode = exitCode;
			} finally {
				process.exit = originalExit;
			}
		};
	}

	describe('should exit on given list of onlyAllow licenses', () => {
		const result = {};
		beforeAll(parseAndFailOn('onlyAllow', '../', 'MIT; ISC', result));

		it('should exit on non MIT and ISC licensed modules from results', () => {
			assert.equal(result.exitCode, 1);
		});
	});

	describe('should exit on single onlyAllow license', () => {
		const result = {};
		beforeAll(parseAndFailOn('onlyAllow', '../', 'ISC', result));

		it('should exit on non ISC licensed modules from results', () => {
			assert.equal(result.exitCode, 1);
		});
	});

	describe('should not exit on complete list', () => {
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

		it('should not exit if list is complete', () => {
			assert.equal(result.exitCode, 0);
		});
	});

	describe('should exit on given list of failOn licenses', () => {
		const result = {};
		beforeAll(parseAndFailOn('failOn', '../', 'MIT; ISC', result));

		it('should exit on MIT and ISC licensed modules from results', () => {
			assert.equal(result.exitCode, 1);
		});
	});

	describe('should exit on single failOn license', () => {
		const result = {};
		beforeAll(parseAndFailOn('failOn', '../', 'ISC', result));

		it('should exit on ISC licensed modules from results', () => {
			assert.equal(result.exitCode, 1);
		});
	});

	describe('should parse local and handle private modules', () => {
		let output;
		beforeAll(async () => {
			output = await initChecker({
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

			assert.ok(privateModule);
		});
	});

	describe('should treat license file over custom urls', () => {
		it('should recognise a custom license at a url', async () => {
			const output = await initChecker({
				start: path.join(__dirname, './fixtures/license-file-only'),
			});
			const item = output[Object.keys(output)[0]];
			assert.equal(item.licenses, 'MIT*');
		});
	});

	describe('should treat URLs as custom licenses', () => {
		let output;
		beforeAll(async () => {
			output = await initChecker({
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
			assert.ok(foundCustomLicense);
		});
	});

	describe('should treat file references as custom licenses', () => {
		let output;
		beforeAll(async () => {
			output = await initChecker({
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
			assert.ok(foundCustomLicense);
		});
	});

	describe('error handler', () => {
		it('should init without errors', async () => {
			const { error } = await initCheckerRaw({
				start: path.join(__dirname, '../'),
				development: true,
			});

			assert.equal(error, null);
		});

		it('should init with errors (npm packages not found)', async () => {
			const { error } = await initCheckerRaw({
				start: 'C:\\',
			});

			assert.ok(error instanceof Error);
		});
	});

	describe('should parse with args', () => {
		it('should handle undefined', () => {
			const result = args.setDefaultArguments(undefined);
			assert.equal(result.color, supportsColor ? supportsColor.hasBasic : false);
			assert.equal(result.start, path.resolve(path.join(__dirname, '../')));
		});

		it('should handle color undefined', () => {
			const result = args.setDefaultArguments({
				color: undefined,
				start: path.resolve(path.join(__dirname, '../')),
			});
			assert.equal(result.color, supportsColor ? supportsColor.hasBasic : false);
			assert.equal(result.start, path.resolve(path.join(__dirname, '../')));
		});

		it('should handle direct undefined', () => {
			const result = args.setDefaultArguments({
				direct: undefined,
				start: path.resolve(path.join(__dirname, '../')),
			});
			assert.equal(result.direct, Number.POSITIVE_INFINITY);
			assert.equal(result.start, path.resolve(path.join(__dirname, '../')));
		});

		it('should handle direct true', () => {
			const result = args.setDefaultArguments({ direct: true, start: path.resolve(path.join(__dirname, '../')) });
			assert.equal(result.direct, Number.POSITIVE_INFINITY);
			assert.equal(result.start, path.resolve(path.join(__dirname, '../')));
		});

		it('should override direct option with depth option', () => {
			const result = args.setDefaultArguments({
				direct: '9',
				depth: '99',
				start: path.resolve(path.join(__dirname, '../')),
			});
			assert.equal(result.direct, 99);
			assert.equal(result.start, path.resolve(path.join(__dirname, '../')));
		});

		it('should use depth for direct option when direct is not provided', () => {
			const result = args.setDefaultArguments({ depth: '99', start: path.resolve(path.join(__dirname, '../')) });
			assert.equal(result.direct, 99);
			assert.equal(result.start, path.resolve(path.join(__dirname, '../')));
		});

		['json', 'markdown', 'csv', 'summary'].forEach(type => {
			it(`should disable color on ${type}`, () => {
				const def = {
					color: undefined,
					start: path.resolve(path.join(__dirname, '../')),
				};
				def[type] = true;
				const result = args.setDefaultArguments(def);
				assert.equal(result.start, path.resolve(path.join(__dirname, '../')));
			});
		});
	});

	describe('custom formats', () => {
		it('should create a custom format using customFormat successfully', async () => {
			const output = await initChecker({
				start: path.join(__dirname, '../'),
				customFormat: {
					name: '<<Default Name>>',
					description: '<<Default Description>>',
					pewpew: '<<Should Never be set>>',
				},
			});

			Object.keys(output).forEach(item => {
				assert.notEqual(output[item].name, undefined);
				assert.notEqual(output[item].description, undefined);
				assert.notEqual(output[item].pewpew, undefined);
				assert.equal(output[item].pewpew, '<<Should Never be set>>');
			});
		});

		it('should create a custom format using customPath', async () => {
			process.argv.push('--customPath');
			process.argv.push('./customFormatExample.json');

			const parsed = args.getNormalizedArguments();
			parsed.start = path.join(__dirname, '../');

			process.argv.pop();
			process.argv.pop();

			const filtered = await initChecker(parsed);
			const customFormatContent = fs.readFileSync(path.join(__dirname, './../customFormatExample.json'), 'utf8');

			assert.notEqual(customFormatContent, undefined);
			assert.notEqual(customFormatContent, null);

			const customJson = JSON.parse(customFormatContent);

			//Test dynamically with the file directly
			Object.keys(filtered).forEach(licenseItem => {
				Object.keys(customJson).forEach(definedItem => {
					assert.notEqual(filtered[licenseItem][definedItem], 'undefined');
				});
			});
		});

		it('should return data for keys with different names in json vs custom format', async () => {
			const filtered = await initChecker({
				start: path.join(__dirname, './fixtures/author'),
				customFormat: {
					publisher: '',
				},
			});

			assert.equal(Object.keys(filtered).length, 1);
			assert.equal(filtered['license-checker-rseidelsohn@0.0.0'].publisher, 'Roman Seidelsohn');
		});
	});

	describe('should output the module location', () => {
		it('as absolute path', async () => {
			const output = await initChecker({
				start: path.join(__dirname, '../'),
			});

			Object.keys(output).forEach(key => {
				const expectedPath = path.resolve(path.join(__dirname, '../'));
				assert.equal(isSameOrChildPath(expectedPath, output[key].path), true);
			});
		});

		it('using only relative paths if the option relativeModulePath is being used', async () => {
			const output = await initChecker({
				start: path.join(__dirname, '../'),
				relativeModulePath: true,
			});
			const rootPath = path.join(__dirname, '../');

			Object.keys(output).forEach(key => {
				const outputPath = output[key].path;
				assert.strictEqual(outputPath.startsWith(rootPath), false, `Output path is not a relative path: ${outputPath}`);
			});
		});
	});

	describe('should output the location of the license files', () => {
		it('as absolute paths', async () => {
			const output = await initChecker({
				start: path.join(__dirname, '../'),
			});

			Object.keys(output)
				.map(key => output[key])
				.filter(dep => dep.licenseFile !== undefined)
				.forEach(dep => {
					const expectedPath = path.resolve(path.join(__dirname, '../'));
					assert.equal(isSameOrChildPath(expectedPath, dep.licenseFile), true);
				});
		});

		it('as relative paths when using relativeLicensePath', async () => {
			const filtered = await initChecker({
				start: path.join(__dirname, '../'),
				relativeLicensePath: true,
			});

			Object.keys(filtered)
				.map(key => filtered[key])
				.filter(dep => dep.licenseFile !== undefined)
				.forEach(dep => {
					assert.notEqual(dep.licenseFile.substr(0, 1), '/');
				});
		});
	});

	describe('handle copytight statement', () => {
		it('should output copyright statements when configured in custom format', async () => {
			const output = await initChecker({
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
			assert.equal(output[abbrevPackageKey].copyright, 'Copyright (c) Isaac Z. Schlueter and Contributors*');
		});
	});

	describe('should only list UNKNOWN or guessed licenses successful', () => {
		let output;
		beforeAll(async () => {
			output = await initChecker({
				start: path.join(__dirname, '../'),
				onlyunknown: true,
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
			assert.ok(onlyStarsFound);
		});
	});

	function parseAndInclude(parsePath, licenses, result) {
		return async () => {
			result.output = await initChecker({
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
			assert.ok(Object.keys(output).length === 1);
		});
	});

	describe('should not list not given packages', () => {
		const result = {};
		beforeAll(parseAndInclude('./fixtures/includeApache', 'BSD', result));

		it('should not include Apache', () => {
			const output = result.output;
			assert.ok(Object.keys(output).length === 0);
		});
	});

	describe('should only list UNKNOWN or guessed licenses with errors (argument missing)', () => {
		let output;
		beforeAll(async () => {
			output = await initChecker({
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
			assert.equal(onlyStarsFound, false);
		});
	});

	describe('should export', () => {
		it('print a tree', () => {
			const log = console.log;
			console.log = data => {
				assert.ok(data);
				assert.ok(data.indexOf('└─') > -1);
			};
			checker.print([{}]);
			console.log = log;
		});

		it('as tree', () => {
			const data = checker.asTree([{}]);
			assert.ok(data);
			assert.ok(data.indexOf('└─') > -1);
		});

		it('as csv', () => {
			const data = checker.asCSV({
				foo: {
					licenses: 'MIT',
					repository: '/path/to/foo',
				},
			});
			assert.ok(data);
			assert.ok(data.indexOf('"foo","MIT","/path/to/foo"') > -1);
		});

		it('as csv with partial data', () => {
			const data = checker.asCSV({
				foo: {},
			});
			assert.ok(data);
			assert.ok(data.indexOf('"foo","",""') > -1);
		});

		it('as markdown', () => {
			const data = checker.asMarkDown({
				foo: {
					licenses: 'MIT',
					repository: '/path/to/foo',
				},
			});
			assert.ok(data);
			assert.ok(data.indexOf('[foo](/path/to/foo) - MIT') > -1);
		});

		it('as summary', () => {
			const data = checker.asSummary({
				foo: {
					licenses: 'MIT',
					repository: '/path/to/foo',
				},
			});
			assert.ok(data);
			assert.ok(data.indexOf('└─') > -1);
		});

		it('as files', () => {
			const out = path.join(tmpdir(), 'lc');
			let files = null;
			checker.asFiles(
				{
					foo: {
						licenses: 'MIT',
						repository: '/path/to/foo',
						licenseFile: path.join(__dirname, '../LICENSE'),
					},
					bar: {
						licenses: 'MIT',
					},
				},
				out
			);

			files = fs.readdirSync(out);
			assert.equal(files[0], 'foo-LICENSE.txt');
			rimraf.sync(out);
		});
	});

	describe('should export', () => {
		let output;

		beforeAll(async () => {
			output = await initChecker({
				start: path.join(__dirname, './fixtures/includeBSD'),
			});
		}, 5000);

		it('an Angular CLI like plain vertical format', () => {
			const data = checker.asPlainVertical(output);
			assert.ok(data);
			assert.equal(
				data,
				`bsd-3-module 0.0.0
BSD-3-Clause
`
			);
		});
	});

	describe('json parsing', () => {
		it('should parse json successfully (File exists + was json)', () => {
			const path = './tests/config/custom_format_correct.json';
			const json = checker.parseJson(path);
			assert.notEqual(json, undefined);
			assert.notEqual(json, null);
			assert.equal(json.licenseModified, 'no');
			assert.ok(json.licenseText);
		});

		it('should parse json with errors (File exists + no json)', () => {
			const path = './tests/config/custom_format_broken.json';
			const json = checker.parseJson(path);
			assert.ok(json instanceof Error);
		});

		it('should parse json with errors (File not found)', () => {
			const path = './NotExitingFile.json';
			const json = checker.parseJson(path);
			assert.ok(json instanceof Error);
		});

		it('should parse json with errors (null passed)', () => {
			const json = checker.parseJson(null);
			assert.ok(json instanceof Error);
		});
	});

	describe('limit attributes', () => {
		it('should filter attributes based on limitAttributes defined', () => {
			const path = './tests/config/custom_format_correct.json';
			const json = checker.parseJson(path);

			const filteredJson = checker.filterAttributes(['version', 'name'], json);

			assert.notStrictEqual(filteredJson.version, undefined);
			assert.notStrictEqual(filteredJson.name, undefined);
			assert.strictEqual(filteredJson.description, undefined);
			assert.strictEqual(filteredJson.licenses, undefined);
			assert.strictEqual(filteredJson.licenseFile, undefined);
			assert.strictEqual(filteredJson.licenseText, undefined);
			assert.strictEqual(filteredJson.licenseModified, undefined);
		});

		it('should keep json as is if no outputColumns defined', () => {
			const path = './tests/config/custom_format_correct.json';
			const json = checker.parseJson(path);

			const filteredJson = checker.filterAttributes(null, json);

			assert.notStrictEqual(filteredJson.version, undefined);
			assert.notStrictEqual(filteredJson.name, undefined);
			assert.notStrictEqual(filteredJson.description, undefined);
			assert.notStrictEqual(filteredJson.licenses, undefined);
			assert.notStrictEqual(filteredJson.licenseFile, undefined);
			assert.notStrictEqual(filteredJson.licenseText, undefined);
			assert.notStrictEqual(filteredJson.licenseModified, undefined);
		});
	});
});
