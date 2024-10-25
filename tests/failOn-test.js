import assert from 'assert'
import path from 'path'
import { spawn } from 'child_process'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

describe('bin/license-checker-rseidelsohn', function () {
    this.timeout(8000);
    it('should exit 1 if it finds a single license type (MIT) license due to --failOn MIT', function (done) {
        spawn('node', [path.join(__dirname, '../bin/license-checker-rseidelsohn'), '--failOn', 'MIT'], {
            cwd: path.join(__dirname, '../'),
            stdio: 'ignore',
        }).on('exit', function (code) {
            assert.equal(code, 1);
            done();
        });
    });

    it('should exit 1 if it finds forbidden licenses license due to --failOn MIT;ISC', function (done) {
        spawn('node', [path.join(__dirname, '../bin/license-checker-rseidelsohn'), '--failOn', 'MIT;ISC'], {
            cwd: path.join(__dirname, '../'),
            stdio: 'ignore',
        }).on('exit', function (code) {
            assert.equal(code, 1);
            done();
        });
    });

    it('should give warning about commas if --failOn MIT,ISC is provided', function (done) {
        var proc = spawn('node', [path.join(__dirname, '../bin/license-checker-rseidelsohn'), '--failOn', 'MIT,ISC'], {
            cwd: path.join(__dirname, '../'),
            stdio: 'pipe',
        });
        var stderr = '';
        proc.stdout.on('data', function () {});
        proc.stderr.on('data', function (data) {
            stderr += data.toString();
        });
        proc.on('close', function () {
            assert.equal(
                stderr.indexOf('--failOn argument takes semicolons as delimeters instead of commas') >= 0,
                true,
            );
            done();
        });
    });
});
