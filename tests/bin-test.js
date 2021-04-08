const assert = require('assert');
const path = require('path');
const spawn = require('child_process').spawn;

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
