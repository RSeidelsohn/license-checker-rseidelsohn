import assert from 'assert'
import path from 'path'
import { spawn } from 'child_process'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

describe('bin/license-checker-rseidelsohn', function () {
    this.timeout(8000);

    it('should exit 0', function (done) {
        spawn('node', [path.join(__dirname, '../bin/license-checker-rseidelsohn')], {
            cwd: path.join(__dirname, '../'),
            stdio: 'ignore',
        }).on('exit', function (code) {
            assert.equal(code, 0);
            done();
        });
    });
});
