import assert from 'assert';
import chalk from 'chalk';
import fs from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import rimraf from 'rimraf';
import util from 'util';
import * as args from '../lib/args.js';
import * as checker from '../lib/index.js';
import pkgJson from '../package.json' with { type: 'json' };

const __dirname = path.dirname(new URL(import.meta.url).pathname);

describe('main tests', () => {
    it('should load init', () => {
        assert.equal(typeof checker.init, 'function');
    });

    it('should load print', () => {
        assert.equal(typeof checker.print, 'function');
    });

    describe('should parse local with unknown', () => {
        let output;

        beforeAll(function (done) {
            this.timeout(5000);

            checker.init(
                {
                    start: path.join(__dirname, '../'),
                },
                (err, sorted) => {
                    output = sorted;
                    done();
                }
            );
        });

        it('and give us results', () => {
            assert.ok(Object.keys(output).length > 70);
            assert.equal(output['abbrev@1.0.9'].licenses, 'ISC');
        });

        it('and convert to CSV', () => {
            const str = checker.asCSV(output);
            assert.equal(str.split('\n')[0], '"module name","license","repository"');
            assert.equal(str.split('\n')[1], '"@babel/code-frame@7.22.13","MIT","https://github.com/babel/babel"');
        });

        it('and convert to MarkDown', () => {
            const str = checker.asMarkDown(output);
            assert.equal(str.split('\n')[0], '- [@babel/code-frame@7.22.13](https://github.com/babel/babel) - MIT');
        });
    });

    describe('should parse local with unknown and custom format', () => {
        let output;

        beforeAll(done => {
            const format = {
                name: '<<Default Name>>',
                description: '<<Default Description>>',
                pewpew: '<<Should Never be set>>',
            };

            checker.init(
                {
                    start: path.join(__dirname, '../'),
                    customFormat: format,
                },
                (err, sorted) => {
                    output = sorted;
                    done();
                }
            );
        });

        it('and give us results', () => {
            assert.ok(Object.keys(output).length > 70);
            assert.equal(output['abbrev@1.0.9'].description, "Like ruby's abbrev module, but in js");
        });

        it('and convert to CSV', () => {
            const format = {
                name: '<<Default Name>>',
                description: '<<Default Description>>',
                pewpew: '<<Should Never be set>>',
            };

            const str = checker.asCSV(output, format);
            assert.equal(str.split('\n')[0], '"module name","name","description","pewpew"');
            assert.equal(
                str.split('\n')[1],
                '"@babel/code-frame@7.22.13","@babel/code-frame","Generate errors that contain a code frame that point to source locations.","<<Should Never be set>>"'
            );
        });

        it('and convert to CSV with component prefix', () => {
            const format = {
                name: '<<Default Name>>',
                description: '<<Default Description>>',
                pewpew: '<<Should Never be set>>',
            };

            const str = checker.asCSV(output, format, 'main-module');
            assert.equal(str.split('\n')[0], '"component","module name","name","description","pewpew"');
            assert.equal(
                str.split('\n')[1],
                '"main-module","@babel/code-frame@7.22.13","@babel/code-frame","Generate errors that contain a code frame that point to source locations.","<<Should Never be set>>"'
            );
        });

        it('and convert to MarkDown', () => {
            const format = {
                name: '<<Default Name>>',
                description: '<<Default Description>>',
                pewpew: '<<Should Never be set>>',
            };

            const str = checker.asMarkDown(output, format);
            assert.equal(str.split('\n')[0], '- **[@babel/code-frame@7.22.13](https://github.com/babel/babel)**');
        });
    });

    describe('should parse local without unknown', () => {
        let output;

        beforeAll(done => {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                    unknown: true,
                },
                (err, sorted) => {
                    output = sorted;
                    done();
                }
            );
        });

        it('should give us results', () => {
            assert.ok(output);
            assert.ok(Object.keys(output).length > 20);
        });
    });

    describe('should parse direct dependencies only', () => {
        let output;

        beforeAll(done => {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                    direct: 0, // 0 is the parsed value passed to init from license-checker-rseidelsohn if set to true
                },
                (err, sorted) => {
                    output = sorted;
                    done();
                }
            );
        });

        it('and give us results', () => {
            const pkgDepsNumber =
                Object.keys(pkgJson.dependencies || {}).length +
                Object.keys(pkgJson.devDependencies || {}).length +
                Object.keys(pkgJson.peerDependencies || {}).length;
            // all and only the dependencies listed in the package.json should be included in the output,
            // plus the main module itself
            assert.ok(Object.keys(output).length === pkgDepsNumber + 1);
            assert.equal(typeof output['abbrev@1.0.9'], 'undefined');
        });
    });

    describe('should write output to files in programmatic usage', () => {
        const tmpFileName = path.join(__dirname, 'tmp_output.json');

        beforeAll(done => {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                    json: true,
                    out: tmpFileName,
                },
                (err, sorted) => {
                    done();
                }
            );
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
        return done => {
            checker.init(
                {
                    start: path.join(__dirname, parsePath),
                    excludeLicenses: licenses,
                },
                (err, filtered) => {
                    result.output = filtered;
                    done();
                }
            );
        };
    }

    describe('should parse local with unknown and excludes', () => {
        let result = {};

        beforeAll(parseAndExclude('../', 'MIT, ISC', result));

        it('should exclude MIT and ISC licensed modules from results', () => {
            let excluded = true;
            const output = result.output;
            Object.keys(output).forEach(item => {
                if (output[item].licenses && (output[item].licenses === 'MIT' || output[item].licenses === 'ISC'))
                    excluded = false;
            });
            assert.ok(excluded);
        });
    });

    describe('should parse local with excludes containing commas', () => {
        let result = {};
        beforeAll(parseAndExclude('./fixtures/excludeWithComma', 'Apache License\\, Version 2.0', result));

        it('should exclude a license with a comma from the list', () => {
            let excluded = true;
            let output = result.output;
            Object.keys(output).forEach(item => {
                if (output[item].licenses && output[item].licenses === 'Apache License, Version 2.0') {
                    excluded = false;
                }
            });
            assert.ok(excluded);
        });
    });

    describe('should parse local with BSD excludes', () => {
        let result = {};
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
        let result = {};
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
        let result = {};
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
        return done => {
            let exitCode = 0;
            process.exit = code => {
                exitCode = code;
            };
            const config = {
                start: path.join(__dirname, parsePath),
            };
            config[key] = licenses;
            checker.init(config, (err, filtered) => {
                result.output = filtered;
                result.exitCode = exitCode;
                done();
            });
        };
    }

    describe('should exit on given list of onlyAllow licenses', () => {
        let result = {};
        beforeAll(parseAndFailOn('onlyAllow', '../', 'MIT; ISC', result));

        it('should exit on non MIT and ISC licensed modules from results', () => {
            assert.equal(result.exitCode, 1);
        });
    });

    describe('should exit on single onlyAllow license', () => {
        let result = {};
        beforeAll(parseAndFailOn('onlyAllow', '../', 'ISC', result));

        it('should exit on non ISC licensed modules from results', () => {
            assert.equal(result.exitCode, 1);
        });
    });

    describe('should not exit on complete list', () => {
        let result = {};
        beforeAll(
            parseAndFailOn(
                'onlyAllow',
                '../',
                'MIT;ISC;MIT;BSD-3-Clause;BSD;Apache-2.0;' +
                    'BSD-2-Clause;Apache*;BSD*;CC-BY-3.0;CC-BY-4.0;Unlicense;CC0-1.0;The MIT License;AFLv2.1,BSD;' +
                    'Public Domain;Custom: http://i.imgur.com/goJdO.png;WTFPL*;Apache License, Version 2.0;' +
                    'WTFPL;(MIT AND CC-BY-3.0);Custom: https://github.com/substack/node-browserify;' +
                    '(AFL-2.1 OR BSD-3-Clause);MIT*;0BSD;(MIT OR CC0-1.0);Apache-2.0*;' +
                    'BSD-3-Clause OR MIT;(WTFPL OR MIT);Python-2.0;BlueOak-1.0.0',
                result
            )
        );

        it('should not exit if list is complete', () => {
            assert.equal(result.exitCode, 0);
        });
    });

    describe('should exit on given list of failOn licenses', () => {
        let result = {};
        beforeAll(parseAndFailOn('failOn', '../', 'MIT; ISC', result));

        it('should exit on MIT and ISC licensed modules from results', () => {
            assert.equal(result.exitCode, 1);
        });
    });

    describe('should exit on single failOn license', () => {
        let result = {};
        beforeAll(parseAndFailOn('failOn', '../', 'ISC', result));

        it('should exit on ISC licensed modules from results', () => {
            assert.equal(result.exitCode, 1);
        });
    });

    describe('should parse local and handle private modules', () => {
        let output;
        beforeAll(done => {
            checker.init(
                {
                    start: path.join(__dirname, './fixtures/privateModule'),
                },
                (err, filtered) => {
                    output = filtered;
                    done();
                }
            );
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
        it('should recognise a custom license at a url', done => {
            checker.init(
                {
                    start: path.join(__dirname, '../node_modules/locale'),
                },
                (err, output) => {
                    const item = output[Object.keys(output)[0]];
                    assert.equal(item.licenses, 'MIT*');
                    done();
                }
            );
        });
    });

    describe('should treat URLs as custom licenses', () => {
        let output;
        beforeAll(done => {
            checker.init(
                {
                    start: path.join(__dirname, './fixtures/custom-license-url'),
                },
                (err, filtered) => {
                    output = filtered;
                    done();
                }
            );
        });

        it('should recognise a custom license at a url', () => {
            let foundCustomLicense = false;
            Object.keys(output).forEach(item => {
                if (output[item].licenses && output[item].licenses === 'Custom: http://example.com/dummy-license')
                    foundCustomLicense = true;
            });
            assert.ok(foundCustomLicense);
        });
    });

    describe('should treat file references as custom licenses', () => {
        let output;
        beforeAll(done => {
            checker.init(
                {
                    start: path.join(__dirname, './fixtures/custom-license-file'),
                },
                (err, filtered) => {
                    output = filtered;
                    done();
                }
            );
        });

        it('should recognise a custom license in a file', () => {
            let foundCustomLicense = false;
            Object.keys(output).forEach(item => {
                if (output[item].licenses && output[item].licenses === 'Custom: MY-LICENSE.md')
                    foundCustomLicense = true;
            });
            assert.ok(foundCustomLicense);
        });
    });

    describe('error handler', () => {
        it('should init without errors', done => {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                    development: true,
                },
                err => {
                    assert.equal(err, null);
                    done();
                }
            );
        });

        it('should init with errors (npm packages not found)', done => {
            checker.init(
                {
                    start: 'C:\\',
                },
                err => {
                    assert.ok(util.isError(err));
                    done();
                }
            );
        });
    });

    describe('should parse with args', () => {
        it('should handle undefined', () => {
            const result = args.setDefaultArguments(undefined);
            assert.equal(result.color, chalk.supportsColor);
            assert.equal(result.start, path.resolve(path.join(__dirname, '../')));
        });

        it('should handle color undefined', () => {
            const result = args.setDefaultArguments({
                color: undefined,
                start: path.resolve(path.join(__dirname, '../')),
            });
            assert.equal(result.color, chalk.supportsColor);
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
            it('should disable color on ' + type, () => {
                let def = {
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
        it('should create a custom format using customFormat successfully', done => {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                    customFormat: {
                        name: '<<Default Name>>',
                        description: '<<Default Description>>',
                        pewpew: '<<Should Never be set>>',
                    },
                },
                (err, d) => {
                    Object.keys(d).forEach(item => {
                        assert.notEqual(d[item].name, undefined);
                        assert.notEqual(d[item].description, undefined);
                        assert.notEqual(d[item].pewpew, undefined);
                        assert.equal(d[item].pewpew, '<<Should Never be set>>');
                    });
                    done();
                }
            );
        });

        it('should create a custom format using customPath', done => {
            process.argv.push('--customPath');
            process.argv.push('./customFormatExample.json');

            const parsed = args.getNormalizedArguments();
            parsed.start = path.join(__dirname, '../');

            process.argv.pop();
            process.argv.pop();

            checker.init(parsed, (err, filtered) => {
                var customFormatContent = fs.readFileSync(
                    path.join(__dirname, './../customFormatExample.json'),
                    'utf8'
                );

                assert.notEqual(customFormatContent, undefined);
                assert.notEqual(customFormatContent, null);

                var customJson = JSON.parse(customFormatContent);

                //Test dynamically with the file directly
                Object.keys(filtered).forEach(licenseItem => {
                    Object.keys(customJson).forEach(definedItem => {
                        assert.notEqual(filtered[licenseItem][definedItem], 'undefined');
                    });
                });
                done();
            });
        });

        it('should return data for keys with different names in json vs custom format', done => {
            checker.init(
                {
                    start: path.join(__dirname, './fixtures/author'),
                    customFormat: {
                        publisher: '',
                    },
                },
                (err, filtered) => {
                    assert.equal(Object.keys(filtered).length, 1);
                    assert.equal(filtered['license-checker-rseidelsohn@0.0.0'].publisher, 'Roman Seidelsohn');
                    done();
                }
            );
        });
    });

    describe('should output the module location', () => {
        it('as absolute path', done => {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                },
                (err, output) => {
                    Object.keys(output).map(key => {
                        const expectedPath = path.join(__dirname, '../');
                        const actualPath = output[key].path.substr(0, expectedPath.length);
                        assert.equal(actualPath, expectedPath);
                    });
                    done();
                }
            );
        });

        it('using only relative paths if the option relativeModulePath is being used', done => {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                    relativeModulePath: true,
                },
                (err, output) => {
                    const rootPath = path.join(__dirname, '../');
                    Object.keys(output).forEach(key => {
                        const outputPath = output[key].path;
                        assert.strictEqual(
                            outputPath.startsWith(rootPath),
                            false,
                            `Output path is not a relative path: ${outputPath}`
                        );
                    });
                    done();
                }
            );
        });
    });

    describe('should output the location of the license files', () => {
        it('as absolute paths', done => {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                },
                (err, output) => {
                    Object.keys(output)
                        .map(key => output[key])
                        .filter(dep => dep.licenseFile !== undefined)
                        .forEach(dep => {
                            const expectedPath = path.join(__dirname, '../');
                            const actualPath = dep.licenseFile.substr(0, expectedPath.length);
                            assert.equal(actualPath, expectedPath);
                        });
                    done();
                }
            );
        });

        it('as relative paths when using relativeLicensePath', done => {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                    relativeLicensePath: true,
                },
                (err, filtered) => {
                    Object.keys(filtered)
                        .map(key => filtered[key])
                        .filter(dep => dep.licenseFile !== undefined)
                        .forEach(dep => {
                            assert.notEqual(dep.licenseFile.substr(0, 1), '/');
                        });
                    done();
                }
            );
        });
    });

    describe('handle copytight statement', () => {
        it('should output copyright statements when configured in custom format', done => {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                    customFormat: {
                        copyright: '', // specify custom format
                        email: false,
                        licenseFile: false,
                        licenseText: false,
                        publisher: false,
                    },
                },
                (err, output) => {
                    assert(output['abbrev@1.0.9'] !== undefined, 'Check if the expected package still exists.');
                    assert.equal(output['abbrev@1.0.9'].copyright, 'Copyright (c) Isaac Z. Schlueter and Contributors');
                    done();
                }
            );
        });
    });

    describe('should only list UNKNOWN or guessed licenses successful', () => {
        let output;
        beforeAll(done => {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                    onlyunknown: true,
                },
                (err, sorted) => {
                    output = sorted;
                    done();
                }
            );
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
        return done => {
            checker.init(
                {
                    start: path.join(__dirname, parsePath),
                    includeLicenses: licenses,
                },
                (err, filtered) => {
                    result.output = filtered;
                    done();
                }
            );
        };
    }

    describe('should list given packages', () => {
        let result = {};
        beforeAll(parseAndInclude('./fixtures/includeBSD', 'BSD', result));

        it('should include only BSD', () => {
            const output = result.output;
            assert.ok(Object.keys(output).length === 1);
        });
    });

    describe('should not list not given packages', () => {
        let result = {};
        beforeAll(parseAndInclude('./fixtures/includeApache', 'BSD', result));

        it('should not include Apache', () => {
            const output = result.output;
            assert.ok(Object.keys(output).length === 0);
        });
    });

    describe('should only list UNKNOWN or guessed licenses with errors (argument missing)', () => {
        let output;
        beforeAll(done => {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                    production: true,
                },
                (err, sorted) => {
                    output = sorted;
                    done();
                }
            );
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

        beforeAll(function (done) {
            this.timeout(5000);

            checker.init(
                {
                    start: path.join(__dirname, './fixtures/includeBSD'),
                },
                (err, sorted) => {
                    output = sorted;
                    done();
                }
            );
        });

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
