const assert = require('assert');
const path = require('path');
const spawn = require('child_process').spawnSync;

describe('bin/license-checker-rseidelsohn', function () {
    this.timeout(8000);

    it('should restrict the output to the provided packages', function () {
        var restrictedPackages = ['@types/node@16.18.11'];
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

    it('should exclude packages starting with', function () {
        const excludedPackages = ['@types', 'spdx'];
        const output = spawn(
            'node',
            [
                path.join(__dirname, '../bin/license-checker-rseidelsohn'),
                '--json',
                '--excludePackagesStartingWith',
                excludedPackages.join(';'),
            ],
            {
                cwd: path.join(__dirname, '../'),
            },
        );

        const packages = Object.keys(JSON.parse(output.stdout.toString()));

        let illegalPackageFound = false;

        // Loop through all packages and check if they start with one of the excluded packages
        packages.forEach(function (p) {
            excludedPackages.forEach(function (excludedPackage) {
                if (p.startsWith(excludedPackage)) {
                    illegalPackageFound = true;
                }
            });
        });

        // If an illegal package was found, the test fails
        assert.ok(!illegalPackageFound);
    });


    it('should combine various types of inclusion and exclusions', function () {
        const excludedPrefix = ['@types', 'spdx'];
        const excludedNames = ['rimraf'];
        const output = spawn(
            'node',
            [
                path.join(__dirname, '../bin/license-checker-rseidelsohn'),
                '--json',
                '--excludePackages',
                excludedNames.join(';'),
                '--excludePackagesStartingWith',
                excludedPrefix.join(';'),
            ],
            {
                cwd: path.join(__dirname, '../'),
            },
        );
        const packages = Object.keys(JSON.parse(output.stdout.toString()));

        let illegalPackageFound = false;

        packages.forEach(function (p) {
            excludedNames.forEach(function (pkgName) {
                if(pkgName.indexOf('@')>1){
                    // check for the exact version
                    if(p === pkgName) illegalPackageFound = true;
                } else if (p.startsWith(`${pkgName}@`)) {
                    illegalPackageFound = true;
                }
            });
            excludedPrefix.forEach(function (prefix) {
                if (p.startsWith(prefix)) {
                    illegalPackageFound = true;
                }
            });
        });

        // If an illegal package was found, the test fails
        assert.ok(!illegalPackageFound);
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
