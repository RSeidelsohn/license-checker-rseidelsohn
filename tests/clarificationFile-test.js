const assert = require('assert');
const path = require('path');
const checker = require('../lib/index');
const { describe } = require('node:test');
const spawn = require('child_process').spawn;


describe('clarifications', function() {
    function parseAndClarify(parsePath, clarificationPath, result) {
        return function(done) {
            checker.init(
                {
                    start: path.join(__dirname, parsePath),
                    clarificationsFile: path.join(__dirname, clarificationPath),
                    customFormat: {
                        "licenses": "",
                        "publisher": "",
                        "email": "",
                        "path": "",
                        "licenseFile": "",
                        "licenseText": ""
                    }
                },
                function(err, filtered) {
                    result.output = filtered;
                    done();
                },
            );
        };
    }

    let result = {};

    const clarifications_path = './fixtures/clarifications';

    before(parseAndClarify(clarifications_path, '../clarificationExample.json', result));

    it('should replace existing license', function() {
        const output = result.output['license-checker-rseidelsohn@0.0.0'];

        assert.equal(output.licenseText, "Some mild rephrasing of an MIT license");
        assert.equal(output.licenses, "MIT");
    });


    it('should exit 1 if the checksum does not match', function(done) {
        let data = "";
        let license_checker = spawn('node', [path.join(__dirname, '../bin/license-checker-rseidelsohn'), '--start', path.join(__dirname, clarifications_path), '--clarificationsFile', path.join(__dirname, clarifications_path, 'mismatchFile.json')], {
            cwd: path.join(__dirname, '../'),
        });

        license_checker.stderr.on('data', function(stderr) {
            data += stderr.toString();
        });

        license_checker.on('exit', function(code) {
            assert.equal(code, 1);
            assert.equal(data.includes("checksum mismatch"), true)
            done();
        });
    });


    it('should exit 1 if no checksum', function(done) {
        let data = "";
        let license_checker = spawn('node', [path.join(__dirname, '../bin/license-checker-rseidelsohn'), '--start', path.join(__dirname, clarifications_path), '--clarificationsFile', path.join(__dirname, clarifications_path, 'badClarification.json')], {
            cwd: path.join(__dirname, '../'),
        });

        license_checker.stderr.on('data', function(stdout) {
            data += stdout.toString();
        });

        license_checker.on('exit', function(code) {
            assert.equal(code, 1);
            assert.equal(data.includes("must have a checksum"), true)
            done();
        });
    })
});
