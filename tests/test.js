const assert = require('assert');
const path = require('path');
const util = require('util');
const checker = require('../lib/index');
let args = require('../lib/args');
const chalk = require('chalk');
const fs = require('fs');

describe('main tests', function () {
    it('should load init', function () {
        assert.equal(typeof checker.init, 'function');
    });

    it('should load print', function () {
        assert.equal(typeof checker.print, 'function');
    });

    describe('should parse local with unknown', function () {
        let output;

        before(function (done) {
            this.timeout(5000);

            checker.init(
                {
                    start: path.join(__dirname, '../'),
                },
                function (err, sorted) {
                    output = sorted;
                    done();
                },
            );
        });

        it('and give us results', function () {
            assert.ok(Object.keys(output).length > 70);
            assert.equal(output['abbrev@1.0.9'].licenses, 'ISC');
        });

        it('and convert to CSV', function () {
            const str = checker.asCSV(output);
            assert.equal(str.split('\n')[0], '"module name","license","repository"');
            assert.equal(str.split('\n')[1], '"@babel/code-frame@7.16.7","MIT","https://github.com/babel/babel"');
        });

        it('and convert to MarkDown', function () {
            const str = checker.asMarkDown(output);
            assert.equal(str.split('\n')[0], '[@babel/code-frame@7.16.7](https://github.com/babel/babel) - MIT');
        });
    });

    describe('should parse local with unknown and custom format', function () {
        let output;

        before(function (done) {
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
                function (err, sorted) {
                    output = sorted;
                    done();
                },
            );
        });

        it('and give us results', function () {
            assert.ok(Object.keys(output).length > 70);
            assert.equal(output['abbrev@1.0.9'].description, "Like ruby's abbrev module, but in js");
        });

        it('and convert to CSV', function () {
            const format = {
                name: '<<Default Name>>',
                description: '<<Default Description>>',
                pewpew: '<<Should Never be set>>',
            };

            const str = checker.asCSV(output, format);
            assert.equal(str.split('\n')[0], '"module name","name","description","pewpew"');
            assert.equal(
                str.split('\n')[1],
                '"@babel/code-frame@7.16.7","@babel/code-frame","Generate errors that contain a code frame that point to source locations.","<<Should Never be set>>"',
            );
        });

        it('and convert to CSV with component prefix', function () {
            const format = {
                name: '<<Default Name>>',
                description: '<<Default Description>>',
                pewpew: '<<Should Never be set>>',
            };

            const str = checker.asCSV(output, format, 'main-module');
            assert.equal(str.split('\n')[0], '"component","module name","name","description","pewpew"');
            assert.equal(
                str.split('\n')[1],
                '"main-module","@babel/code-frame@7.16.7","@babel/code-frame","Generate errors that contain a code frame that point to source locations.","<<Should Never be set>>"',
            );
        });

        it('and convert to MarkDown', function () {
            const format = {
                name: '<<Default Name>>',
                description: '<<Default Description>>',
                pewpew: '<<Should Never be set>>',
            };

            const str = checker.asMarkDown(output, format);
            assert.equal(str.split('\n')[0], ' - **[@babel/code-frame@7.16.7](https://github.com/babel/babel)**');
        });
    });

    describe('should parse local without unknown', function () {
        let output;

        before(function (done) {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                    unknown: true,
                },
                function (err, sorted) {
                    output = sorted;
                    done();
                },
            );
        });

        it('should give us results', function () {
            assert.ok(output);
            assert.ok(Object.keys(output).length > 20);
        });
    });

    function parseAndExclude(parsePath, licenses, result) {
        return function (done) {
            checker.init(
                {
                    start: path.join(__dirname, parsePath),
                    excludeLicenses: licenses,
                },
                function (err, filtered) {
                    result.output = filtered;
                    done();
                },
            );
        };
    }

    describe('should parse local with unknown and excludes', function () {
        let result = {};

        before(parseAndExclude('../', 'MIT, ISC', result));

        it('should exclude MIT and ISC licensed modules from results', function () {
            let excluded = true;
            const output = result.output;
            Object.keys(output).forEach(function (item) {
                if (output[item].licenses && (output[item].licenses === 'MIT' || output[item].licenses === 'ISC'))
                    excluded = false;
            });
            assert.ok(excluded);
        });
    });

    describe('should parse local with excludes containing commas', function () {
        let result = {};
        before(parseAndExclude('./fixtures/excludeWithComma', 'Apache License\\, Version 2.0', result));

        it('should exclude a license with a comma from the list', function () {
            let excluded = true;
            let output = result.output;
            Object.keys(output).forEach(function (item) {
                if (output[item].licenses && output[item].licenses === 'Apache License, Version 2.0') {
                    excluded = false;
                }
            });
            assert.ok(excluded);
        });
    });

    describe('should parse local with BSD excludes', function () {
        let result = {};
        before(parseAndExclude('./fixtures/excludeBSD', 'BSD', result));

        it('should exclude BSD-3-Clause', function () {
            let excluded = true;
            const output = result.output;
            Object.keys(output).forEach(function (item) {
                if (output[item].licenses && output[item].licenses === 'BSD-3-Clause') {
                    excluded = false;
                }
            });
            assert.ok(excluded);
        });
    });

    describe('should parse local with Public Domain excludes', function () {
        let result = {};
        before(parseAndExclude('./fixtures/excludePublicDomain', 'Public Domain', result));

        it('should exclude Public Domain', function () {
            let excluded = true;
            const output = result.output;
            Object.keys(output).forEach(function (item) {
                if (output[item].licenses && output[item].licenses === 'Public Domain') {
                    excluded = false;
                }
            });
            assert.ok(excluded);
        });
    });

    describe('should not exclude Custom if not specified in excludes', function () {
        let result = {};
        before(parseAndExclude('./fixtures/custom-license-file', 'MIT', result));

        it('should exclude Public Domain', function () {
            let excluded = true;
            const output = result.output;
            Object.keys(output).forEach(function (item) {
                if (output[item].licenses && output[item].licenses === 'Custom: MY-LICENSE.md') {
                    excluded = false;
                }
            });
            assert.ok(!excluded);
        });
    });

    function parseAndFailOn(key, parsePath, licenses, result) {
        return function (done) {
            let exitCode = 0;
            process.exit = function (code) {
                exitCode = code;
            };
            const config = {
                start: path.join(__dirname, parsePath),
            };
            config[key] = licenses;
            checker.init(config, function (err, filtered) {
                result.output = filtered;
                result.exitCode = exitCode;
                done();
            });
        };
    }

    describe('should exit on given list of onlyAllow licenses', function () {
        let result = {};
        before(parseAndFailOn('onlyAllow', '../', 'MIT; ISC', result));

        it('should exit on non MIT and ISC licensed modules from results', function () {
            assert.equal(result.exitCode, 1);
        });
    });

    describe('should exit on single onlyAllow license', function () {
        let result = {};
        before(parseAndFailOn('onlyAllow', '../', 'ISC', result));

        it('should exit on non ISC licensed modules from results', function () {
            assert.equal(result.exitCode, 1);
        });
    });

    describe('should not exit on complete list', function () {
        let result = {};
        before(
            parseAndFailOn(
                'onlyAllow',
                '../',
                'MIT;ISC;MIT;BSD-3-Clause;BSD;Apache-2.0;' +
                    'BSD-2-Clause;Apache*;BSD*;CC-BY-3.0;Unlicense;CC0-1.0;The MIT License;AFLv2.1,BSD;' +
                    'Public Domain;Custom: http://i.imgur.com/goJdO.png;WTFPL*;Apache License, Version 2.0;' +
                    'WTFPL;(MIT AND CC-BY-3.0);Custom: https://github.com/substack/node-browserify;' +
                    'BSD-3-Clause OR MIT;(WTFPL OR MIT);Python-2.0',
                result,
            ),
        );

        it('should not exit if list is complete', function () {
            assert.equal(result.exitCode, 0);
        });
    });

    describe('should exit on given list of failOn licenses', function () {
        let result = {};
        before(parseAndFailOn('failOn', '../', 'MIT; ISC', result));

        it('should exit on MIT and ISC licensed modules from results', function () {
            assert.equal(result.exitCode, 1);
        });
    });

    describe('should exit on single failOn license', function () {
        let result = {};
        before(parseAndFailOn('failOn', '../', 'ISC', result));

        it('should exit on ISC licensed modules from results', function () {
            assert.equal(result.exitCode, 1);
        });
    });

    describe('should parse local and handle private modules', function () {
        let output;
        before(function (done) {
            checker.init(
                {
                    start: path.join(__dirname, './fixtures/privateModule'),
                },
                function (err, filtered) {
                    output = filtered;
                    done();
                },
            );
        });

        it('should recognise private modules', function () {
            let privateModule = false;

            Object.keys(output).forEach(function (item) {
                if (output[item].licenses && output[item].licenses.indexOf('UNLICENSED') >= 0) {
                    privateModule = true;
                }
            });

            assert.ok(privateModule);
        });
    });

    describe('should treat license file over custom urls', function () {
        it('should recognise a custom license at a url', function (done) {
            checker.init(
                {
                    start: path.join(__dirname, '../node_modules/locale'),
                },
                function (err, output) {
                    const item = output[Object.keys(output)[0]];
                    assert.equal(item.licenses, 'MIT*');
                    done();
                },
            );
        });
    });

    describe('should treat URLs as custom licenses', function () {
        let output;
        before(function (done) {
            checker.init(
                {
                    start: path.join(__dirname, './fixtures/custom-license-url'),
                },
                function (err, filtered) {
                    output = filtered;
                    done();
                },
            );
        });

        it('should recognise a custom license at a url', function () {
            let foundCustomLicense = false;
            Object.keys(output).forEach(function (item) {
                if (output[item].licenses && output[item].licenses === 'Custom: http://example.com/dummy-license')
                    foundCustomLicense = true;
            });
            assert.ok(foundCustomLicense);
        });
    });

    describe('should treat file references as custom licenses', function () {
        let output;
        before(function (done) {
            checker.init(
                {
                    start: path.join(__dirname, './fixtures/custom-license-file'),
                },
                function (err, filtered) {
                    output = filtered;
                    done();
                },
            );
        });

        it('should recognise a custom license in a file', function () {
            let foundCustomLicense = false;
            Object.keys(output).forEach(function (item) {
                if (output[item].licenses && output[item].licenses === 'Custom: MY-LICENSE.md')
                    foundCustomLicense = true;
            });
            assert.ok(foundCustomLicense);
        });
    });

    describe('error handler', function () {
        it('should init without errors', function (done) {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                    development: true,
                },
                function (err) {
                    assert.equal(err, null);
                    done();
                },
            );
        });

        it('should init with errors (npm packages not found)', function (done) {
            checker.init(
                {
                    start: 'C:\\',
                },
                function (err) {
                    assert.ok(util.isError(err));
                    done();
                },
            );
        });
    });

    describe('should parse with args', function () {
        let args = require('../lib/args.js');

        it('should handle undefined', function () {
            const result = args.setDefaults(undefined);
            assert.equal(result.color, chalk.supportsColor);
            assert.equal(result.start, path.resolve(path.join(__dirname, '../')));
        });

        it('should handle color undefined', function () {
            const result = args.setDefaults({ color: undefined, start: path.resolve(path.join(__dirname, '../')) });
            assert.equal(result.color, chalk.supportsColor);
            assert.equal(result.start, path.resolve(path.join(__dirname, '../')));
        });

        it('should handle direct undefined', function () {
            const result = args.setDefaults({ direct: undefined, start: path.resolve(path.join(__dirname, '../')) });
            assert.equal(result.direct, Infinity);
            assert.equal(result.start, path.resolve(path.join(__dirname, '../')));
        });

        it('should handle direct true', function () {
            const result = args.setDefaults({ direct: true, start: path.resolve(path.join(__dirname, '../')) });
            assert.equal(result.direct, 0);
            assert.equal(result.start, path.resolve(path.join(__dirname, '../')));
        });

        ['json', 'markdown', 'csv', 'summary'].forEach(function (type) {
            it('should disable color on ' + type, function () {
                let def = {
                    color: undefined,
                    start: path.resolve(path.join(__dirname, '../')),
                };
                def[type] = true;
                const result = args.setDefaults(def);
                assert.equal(result.start, path.resolve(path.join(__dirname, '../')));
            });
        });
    });

    describe('custom formats', function () {
        it('should create a custom format using customFormat successfully', function (done) {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                    customFormat: {
                        name: '<<Default Name>>',
                        description: '<<Default Description>>',
                        pewpew: '<<Should Never be set>>',
                    },
                },
                function (err, d) {
                    Object.keys(d).forEach(function (item) {
                        assert.notEqual(d[item].name, undefined);
                        assert.notEqual(d[item].description, undefined);
                        assert.notEqual(d[item].pewpew, undefined);
                        assert.equal(d[item].pewpew, '<<Should Never be set>>');
                    });
                    done();
                },
            );
        });

        it('should create a custom format using customPath', function (done) {
            process.argv.push('--customPath');
            process.argv.push('./customFormatExample.json');

            args = args.parse();
            args.start = path.join(__dirname, '../');

            process.argv.pop();
            process.argv.pop();

            checker.init(args, function (err, filtered) {
                var customFormatContent = fs.readFileSync(
                    path.join(__dirname, './../customFormatExample.json'),
                    'utf8',
                );

                assert.notEqual(customFormatContent, undefined);
                assert.notEqual(customFormatContent, null);

                var customJson = JSON.parse(customFormatContent);

                //Test dynamically with the file directly
                Object.keys(filtered).forEach(function (licenseItem) {
                    Object.keys(customJson).forEach(function (definedItem) {
                        assert.notEqual(filtered[licenseItem][definedItem], 'undefined');
                    });
                });
                done();
            });
        });

        it('should return data for keys with different names in json vs custom format', function (done) {
            checker.init(
                {
                    start: path.join(__dirname, './fixtures/author'),
                    customFormat: {
                        publisher: '',
                    },
                },
                function (err, filtered) {
                    assert.equal(Object.keys(filtered).length, 1);
                    assert.equal(filtered['license-checker-rseidelsohn@0.0.0'].publisher, 'Roman Seidelsohn');
                    done();
                },
            );
        });
    });

    describe('should output the module location', function () {
        it('as absolute path', function (done) {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                },
                function (err, output) {
                    Object.keys(output).map(function (key) {
                        const expectedPath = path.join(__dirname, '../');
                        const actualPath = output[key].path.substr(0, expectedPath.length);
                        assert.equal(actualPath, expectedPath);
                    });
                    done();
                },
            );
        });

        it('using only relative paths if the option relativeModulePath is being used', function (done) {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                    relativeModulePath: true,
                },
                function (err, output) {
                    const rootPath = path.join(__dirname, '../');
                    Object.keys(output).forEach(function (key) {
                        const outputPath = output[key].path;
                        assert.strictEqual(
                            outputPath.startsWith(rootPath),
                            false,
                            `Output path is not a relative path: ${outputPath}`,
                        );
                    });
                    done();
                },
            );
        });
    });

    describe('should output the location of the license files', function () {
        it('as absolute paths', function (done) {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                },
                function (err, output) {
                    Object.keys(output)
                        .map(function (key) {
                            return output[key];
                        })
                        .filter(function (dep) {
                            return dep.licenseFile !== undefined;
                        })
                        .forEach(function (dep) {
                            const expectedPath = path.join(__dirname, '../');
                            const actualPath = dep.licenseFile.substr(0, expectedPath.length);
                            assert.equal(actualPath, expectedPath);
                        });
                    done();
                },
            );
        });

        it('as relative paths when using relativeLicensePath', function (done) {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                    relativeLicensePath: true,
                },
                function (err, filtered) {
                    Object.keys(filtered)
                        .map(function (key) {
                            return filtered[key];
                        })
                        .filter(function (dep) {
                            return dep.licenseFile !== undefined;
                        })
                        .forEach(function (dep) {
                            assert.notEqual(dep.licenseFile.substr(0, 1), '/');
                        });
                    done();
                },
            );
        });
    });

    describe('handle copytight statement', function () {
        it('should output copyright statements when configured in custom format', function (done) {
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
                function (err, output) {
                    assert(output['abbrev@1.0.9'] !== undefined, 'Check if the expected package still exists.');
                    assert.equal(output['abbrev@1.0.9'].copyright, 'Copyright (c) Isaac Z. Schlueter and Contributors');
                    done();
                },
            );
        });
    });

    describe('should only list UNKNOWN or guessed licenses successful', function () {
        let output;
        before(function (done) {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                    onlyunknown: true,
                },
                function (err, sorted) {
                    output = sorted;
                    done();
                },
            );
        });

        it('so we check if there is no license with a star or UNKNOWN found', function () {
            let onlyStarsFound = true;
            Object.keys(output).forEach(function (item) {
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
        return function (done) {
            checker.init(
                {
                    start: path.join(__dirname, parsePath),
                    includeLicenses: licenses,
                },
                function (err, filtered) {
                    result.output = filtered;
                    done();
                },
            );
        };
    }

    describe('should list given packages', function () {
        let result = {};
        before(parseAndInclude('./fixtures/includeBSD', 'BSD', result));

        it('should include only BSD', function () {
            const output = result.output;
            assert.ok(Object.keys(output).length === 1);
        });
    });

    describe('should not list not given packages', function () {
        let result = {};
        before(parseAndInclude('./fixtures/includeApache', 'BSD', result));

        it('should not include Apache', function () {
            const output = result.output;
            assert.ok(Object.keys(output).length === 0);
        });
    });

    describe('should only list UNKNOWN or guessed licenses with errors (argument missing)', function () {
        let output;
        before(function (done) {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                    production: true,
                },
                function (err, sorted) {
                    output = sorted;
                    done();
                },
            );
        });

        it('so we check if there is no license with a star or UNKNOWN found', function () {
            let onlyStarsFound = true;

            Object.keys(output).forEach(function (item) {
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

    describe('should export', function () {
        it('print a tree', function () {
            const log = console.log;
            console.log = function (data) {
                assert.ok(data);
                assert.ok(data.indexOf('└─') > -1);
            };
            checker.print([{}]);
            console.log = log;
        });

        it('as tree', function () {
            const data = checker.asTree([{}]);
            assert.ok(data);
            assert.ok(data.indexOf('└─') > -1);
        });

        it('as csv', function () {
            const data = checker.asCSV({
                foo: {
                    licenses: 'MIT',
                    repository: '/path/to/foo',
                },
            });
            assert.ok(data);
            assert.ok(data.indexOf('"foo","MIT","/path/to/foo"') > -1);
        });

        it('as csv with partial data', function () {
            const data = checker.asCSV({
                foo: {},
            });
            assert.ok(data);
            assert.ok(data.indexOf('"foo","",""') > -1);
        });

        it('as markdown', function () {
            const data = checker.asMarkDown({
                foo: {
                    licenses: 'MIT',
                    repository: '/path/to/foo',
                },
            });
            assert.ok(data);
            assert.ok(data.indexOf('[foo](/path/to/foo) - MIT') > -1);
        });

        it('as summary', function () {
            const data = checker.asSummary({
                foo: {
                    licenses: 'MIT',
                    repository: '/path/to/foo',
                },
            });
            assert.ok(data);
            assert.ok(data.indexOf('└─') > -1);
        });

        it('as files', function () {
            const out = path.join(require('os').tmpdir(), 'lc');
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
                out,
            );

            files = fs.readdirSync(out);
            assert.equal(files[0], 'foo-LICENSE.txt');
            require('rimraf').sync(out);
        });
    });

    describe('should export', function () {
        let output;

        before(function (done) {
            this.timeout(5000);

            checker.init(
                {
                    start: path.join(__dirname, './fixtures/includeBSD'),
                },
                function (err, sorted) {
                    output = sorted;
                    done();
                },
            );
        });

        it('an Angular CLI like plain vertical format', function () {
            const data = checker.asPlainVertical(output);
            assert.ok(data);
            assert.equal(
                data,
                `bsd-3-module 0.0.0
BSD-3-Clause
`,
            );
        });
    });

    describe('json parsing', function () {
        it('should parse json successfully (File exists + was json)', function () {
            const path = './tests/config/custom_format_correct.json';
            const json = checker.parseJson(path);
            assert.notEqual(json, undefined);
            assert.notEqual(json, null);
            assert.equal(json.licenseModified, 'no');
            assert.ok(json.licenseText);
        });

        it('should parse json with errors (File exists + no json)', function () {
            const path = './tests/config/custom_format_broken.json';
            const json = checker.parseJson(path);
            assert.ok(json instanceof Error);
        });

        it('should parse json with errors (File not found)', function () {
            const path = './NotExitingFile.json';
            const json = checker.parseJson(path);
            assert.ok(json instanceof Error);
        });

        it('should parse json with errors (null passed)', function () {
            const json = checker.parseJson(null);
            assert.ok(json instanceof Error);
        });
    });
});
