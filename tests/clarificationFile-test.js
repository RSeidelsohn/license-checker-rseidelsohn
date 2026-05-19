import { describe } from 'node:test';
import assert from 'assert';
import { spawn } from 'child_process';
import path from 'path';
import { init } from '../lib/index.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

describe('clarifications', () => {
    const clarifications_path = './fixtures/clarifications';
    let result = {};

    beforeAll(
        async () =>
            new Promise(resolve => {
                init(
                    {
                        start: path.join(__dirname, clarifications_path),
                        clarificationsFile: path.join(__dirname, '../clarificationExample.json'),
                        customFormat: {
                            licenses: '',
                            publisher: '',
                            email: '',
                            path: '',
                            licenseFile: '',
                            licenseText: '',
                        },
                    },
                    (err, filtered) => {
                        result.output = filtered;
                        resolve();
                    }
                );
            })
    );

    it('should replace existing license', () => {
        const output = result.output['license-checker-rseidelsohn@0.0.0'];

        assert.equal(output.licenseText, 'Some mild rephrasing of an MIT license');
        assert.equal(output.licenses, 'MIT');
    });

    it('should exit 1 if the checksum does not match', done => {
        let data = '';
        let license_checker = spawn(
            'node',
            [
                path.join(__dirname, '../bin/license-checker-rseidelsohn'),
                '--start',
                path.join(__dirname, clarifications_path),
                '--clarificationsFile',
                path.join(__dirname, clarifications_path, 'mismatch/clarification.json'),
            ],
            {
                cwd: path.join(__dirname, '../'),
            }
        );

        license_checker.stderr.on('data', stderr => {
            data += stderr.toString();
        });

        license_checker.on('exit', code => {
            assert.equal(code, 1);
            assert.equal(data.includes('checksum mismatch'), true);
            done();
        });
    });

    it('should succeed if no checksum is specified', done => {
        let data = '';

        let license_checker = spawn(
            'node',
            [
                path.join(__dirname, '../bin/license-checker-rseidelsohn'),
                '--start',
                path.join(__dirname, clarifications_path),
                '--clarificationsFile',
                path.join(__dirname, clarifications_path, 'example/noChecksum.json'),
            ],
            {
                cwd: path.join(__dirname, '../'),
            }
        );

        license_checker.stdout.on('data', stdout => {
            data += stdout.toString();
        });

        license_checker.on('exit', code => {
            assert.equal(code, 0);
            assert.equal(data.includes('MIT'), true);
            assert.equal(data.includes('MY_IP'), true);
            done();
        });
    });

    it('should snip the embedded license out of the README', done => {
        let data = '';

        let license_checker = spawn(
            'node',
            [
                path.join(__dirname, '../bin/license-checker-rseidelsohn'),
                '--start',
                path.join(__dirname, clarifications_path),
                '--clarificationsFile',
                path.join(__dirname, clarifications_path, 'weirdStart/clarification.json'),
                '--customPath',
                path.join(__dirname, clarifications_path, 'weirdStart/customFormat.json'),
            ],
            {
                cwd: path.join(__dirname, '../'),
            }
        );

        license_checker.stdout.on('data', stdout => {
            data += stdout.toString();
        });

        license_checker.on('exit', code => {
            assert.equal(code, 0);
            assert.equal(data.includes('README'), true);
            assert.equal(data.includes('text text text describing the project'), false);
            assert.equal(data.includes('# LICENSE'), true);
            assert.equal(data.includes('Standard MIT license'), true);
            assert.equal(data.includes('# And one more thing...'), false);
            assert.equal(data.includes('More text AFTER the license because the real world is difficult :('), false);
            done();
        });
    });

    it('should snip the embedded license in the README to the end.', done => {
        let data = '';

        let license_checker = spawn(
            'node',
            [
                path.join(__dirname, '../bin/license-checker-rseidelsohn'),
                '--start',
                path.join(__dirname, clarifications_path),
                '--clarificationsFile',
                path.join(__dirname, clarifications_path, 'weirdStart/startOnlyClarification.json'),
                '--customPath',
                path.join(__dirname, clarifications_path, 'weirdStart/customFormat.json'),
            ],
            {
                cwd: path.join(__dirname, '../'),
            }
        );

        license_checker.stdout.on('data', stdout => {
            data += stdout.toString();
        });

        license_checker.on('exit', code => {
            assert.equal(code, 0);
            assert.equal(data.includes('README'), true);
            assert.equal(data.includes('text text text describing the project'), false);
            assert.equal(data.includes('# LICENSE'), true);
            assert.equal(data.includes('Standard MIT license'), true);
            assert.equal(data.includes('# And one more thing...'), true);
            assert.equal(data.includes('More text AFTER the license because the real world is difficult :('), true);
            done();
        });
    });
});
