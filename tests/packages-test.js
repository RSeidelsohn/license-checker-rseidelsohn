const assert = require('assert');
const path = require('path');
const spawn = require('child_process').spawnSync;

describe('bin/license-checker-rseidelsohn', function () {
    this.timeout(8000);

    it('should restrict the output to the provided packages', function () {
        var restrictedPackages = ['@types/node@16.11.21'];
        var output = spawn(
            'node',
            [
                path.join(__dirname, '../bin/license-checker-rseidelsohn'),
                '--json',
                '--includePackages',
                restrictedPackages.join(';'),
            ],
            {
                cwd: path.join(__dirname, '../'),
            },
        );

        console.log(output.stderr.toString());
        assert.deepEqual(Object.keys(JSON.parse(output.stdout.toString())), restrictedPackages);
    });

    it('should exclude provided excludedPackages from the output', function () {
        var excludedPackages = ['@types/node@15.0.1', 'spdx-satisfies@5.0.0', 'y18n@3.2.1'];
        var output = spawn(
            'node',
            [
                path.join(__dirname, '../bin/license-checker-rseidelsohn'),
                '--json',
                '--excludePackages',
                excludedPackages.join(';'),
            ],
            {
                cwd: path.join(__dirname, '../'),
            },
        );

        var packages = Object.keys(JSON.parse(output.stdout.toString()));
        excludedPackages.forEach(function (pkg) {
            assert.ok(!packages.includes(pkg));
        });
    });

    it('should exclude private packages from the output', function () {
        var output = spawn(
            'node',
            [path.join(__dirname, '../bin/license-checker-rseidelsohn'), '--json', '--excludePrivatePackages'],
            {
                cwd: path.join(__dirname, 'fixtures', 'privateModule'),
            },
        );

        var packages = Object.keys(JSON.parse(output.stdout.toString()));
        assert.equal(packages.length, 0);
    });
});
