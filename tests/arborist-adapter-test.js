import assert from 'node:assert';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import * as args from '../lib/args.js';
import { runLicenseCheck } from '../lib/index.js';
import readInstalledPackages from '../lib/readInstalledPackagesWithArborist.js';

const createTempDirectory = () => fs.mkdtempSync(path.join(fs.realpathSync(tmpdir()), 'license-checker-'));

const writePackage = (directory, packageJson) => {
	fs.mkdirSync(directory, { recursive: true });
	fs.writeFileSync(path.join(directory, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);
};

const writeHiddenLockfile = (root, packages) => {
	const hiddenLockfilePath = path.join(root, 'node_modules/.package-lock.json');

	fs.mkdirSync(path.dirname(hiddenLockfilePath), { recursive: true });
	fs.writeFileSync(
		hiddenLockfilePath,
		`${JSON.stringify(
			{
				name: 'fixture-root',
				version: '1.0.0',
				lockfileVersion: 3,
				requires: true,
				packages,
			},
			null,
			2
		)}\n`
	);

	const future = new Date(Date.now() + 10000);
	fs.utimesSync(hiddenLockfilePath, future, future);
};

const createDependencyModeFixture = () => {
	const root = createTempDirectory();

	writePackage(root, {
		name: 'fixture-root',
		version: '1.0.0',
		license: 'MIT',
		dependencies: {
			'@scope/scoped': '1.0.0',
			missingRequired: '1.0.0',
			prod: '1.0.0',
		},
		devDependencies: {
			dev: '1.0.0',
		},
		optionalDependencies: {
			missingOptional: '1.0.0',
		},
		peerDependencies: {
			peer: '1.0.0',
		},
	});

	writePackage(path.join(root, 'node_modules/prod'), {
		name: 'prod',
		version: '1.0.0',
		license: 'MIT',
		dependencies: {
			transitive: '1.0.0',
		},
	});
	writePackage(path.join(root, 'node_modules/transitive'), {
		name: 'transitive',
		version: '1.0.0',
		license: 'Apache-2.0',
	});
	writePackage(path.join(root, 'node_modules/dev'), {
		name: 'dev',
		version: '1.0.0',
		license: 'ISC',
	});
	writePackage(path.join(root, 'node_modules/peer'), {
		name: 'peer',
		version: '1.0.0',
		license: 'BSD-3-Clause',
	});
	writePackage(path.join(root, 'node_modules/@scope/scoped'), {
		name: '@scope/scoped',
		version: '1.0.0',
		license: '0BSD',
	});

	return root;
};

describe('readInstalledPackagesWithArborist', () => {
	let root;

	beforeEach(() => {
		root = createDependencyModeFixture();
	});

	afterEach(() => {
		fs.rmSync(root, { force: true, recursive: true });
	});

	it('converts Arborist nodes to the expected package object shape', async () => {
		const installedPackages = await readInstalledPackages(root);

		assert.equal(installedPackages.root, true);
		assert.equal(installedPackages.name, 'fixture-root');
		assert.equal(installedPackages.path, root);
		assert.equal(installedPackages.dependencies.prod.name, 'prod');
		assert.equal(installedPackages.dependencies['@scope/scoped'].name, '@scope/scoped');
		assert.equal(installedPackages.dependencies['@scope/scoped'].realName, '@scope/scoped');
		assert.equal(installedPackages.dependencies.missingRequired, '1.0.0');
		assert.equal(installedPackages.dependencies.missingOptional, undefined);
	});

	it('preserves license fields from on-disk package.json when Arborist reads hidden lockfile metadata', async () => {
		writeHiddenLockfile(root, {
			'': {
				name: 'fixture-root',
				version: '1.0.0',
				dependencies: {
					prod: '1.0.0',
				},
			},
			'node_modules/prod': {
				version: '1.0.0',
			},
		});

		const installedPackages = await readInstalledPackages(root);

		assert.equal(installedPackages.license, 'MIT');
		assert.equal(installedPackages.dependencies.prod.license, 'MIT');
	});

	it('preserves legacy licenses fields from on-disk package.json', async () => {
		const legacyLicenses = [{ type: 'Apache-2.0' }, { type: 'MIT' }];
		writePackage(path.join(root, 'node_modules/prod'), {
			name: 'prod',
			version: '1.0.0',
			licenses: legacyLicenses,
		});

		const installedPackages = await readInstalledPackages(root);

		assert.deepEqual(installedPackages.dependencies.prod.licenses, legacyLicenses);
	});

	it('normalizes package metadata like the previous read-installed-packages reader', async () => {
		writePackage(path.join(root, 'node_modules/prod'), {
			name: 'prod',
			version: '1.0.0',
			license: 'MIT',
			author: 'Jane Doe <jane@example.com> (https://example.com)',
			repository: 'git+https://github.com/example/prod.git',
		});

		const installedPackages = await readInstalledPackages(root);
		const prodPackage = installedPackages.dependencies.prod;

		assert.deepEqual(prodPackage.author, {
			name: 'Jane Doe',
			email: 'jane@example.com',
			url: 'https://example.com',
		});
		assert.deepEqual(prodPackage.repository, {
			type: 'git',
			url: 'git+https://github.com/example/prod.git',
		});
	});

	it('omits peer dependencies when requested', async () => {
		const installedPackages = await readInstalledPackages(root, { nopeer: true });

		assert.equal(installedPackages.dependencies.peer, undefined);
	});

	it('handles symlinked packages without losing link metadata or recursing forever', async () => {
		const base = createTempDirectory();
		const linkRoot = path.join(base, 'root');
		const linkedTarget = path.join(base, 'linked-target');

		try {
			writePackage(linkRoot, {
				name: 'link-root',
				version: '1.0.0',
				dependencies: {
					linked: 'file:../linked-target',
				},
			});
			writePackage(linkedTarget, {
				name: 'linked',
				version: '1.0.0',
				dependencies: {
					linkedDependency: '1.0.0',
				},
			});
			writePackage(path.join(linkedTarget, 'node_modules/linkedDependency'), {
				name: 'linkedDependency',
				version: '1.0.0',
			});
			fs.mkdirSync(path.join(linkRoot, 'node_modules'), { recursive: true });
			fs.symlinkSync(linkedTarget, path.join(linkRoot, 'node_modules/linked'), 'dir');

			const installedPackages = await readInstalledPackages(linkRoot);
			const linkedPackage = installedPackages.dependencies.linked;

			assert.equal(linkedPackage.link, linkedTarget);
			assert.equal(linkedPackage.path, path.join(linkRoot, 'node_modules/linked'));
			assert.equal(linkedPackage.realPath, linkedTarget);
			assert.equal(linkedPackage.parent, undefined);
			assert.equal(linkedPackage.dependencies.linkedDependency.name, 'linkedDependency');
		} finally {
			fs.rmSync(base, { force: true, recursive: true });
		}
	});
});

describe('runLicenseCheck with Arborist dependency trees', () => {
	let root;

	beforeEach(() => {
		root = createDependencyModeFixture();
	});

	afterEach(() => {
		fs.rmSync(root, { force: true, recursive: true });
	});

	it('includes production and development dependencies by default', async () => {
		const output = await runLicenseCheck({ start: root });

		assert.notEqual(output['prod@1.0.0'], undefined);
		assert.notEqual(output['transitive@1.0.0'], undefined);
		assert.notEqual(output['dev@1.0.0'], undefined);
		assert.notEqual(output['peer@1.0.0'], undefined);
		assert.notEqual(output['@scope/scoped@1.0.0'], undefined);
	});

	it('includes publisher from normalized author data without requiring custom format', async () => {
		writePackage(path.join(root, 'node_modules/prod'), {
			name: 'prod',
			version: '1.0.0',
			license: 'MIT',
			author: 'Jane Doe <jane@example.com>',
		});

		const output = await runLicenseCheck({ json: true, start: root });

		assert.equal(output['prod@1.0.0'].publisher, 'Jane Doe');
		assert.equal(output['prod@1.0.0'].email, 'jane@example.com');
	});

	it('excludes dev-only dependencies in production mode', async () => {
		const output = await runLicenseCheck({ production: true, start: root });

		assert.notEqual(output['prod@1.0.0'], undefined);
		assert.notEqual(output['transitive@1.0.0'], undefined);
		assert.equal(output['dev@1.0.0'], undefined);
	});

	it('includes dev-only dependencies and excludes production-only dependencies in development mode', async () => {
		const output = await runLicenseCheck({ development: true, start: root });

		assert.notEqual(output['fixture-root@1.0.0'], undefined);
		assert.notEqual(output['dev@1.0.0'], undefined);
		assert.equal(output['prod@1.0.0'], undefined);
		assert.equal(output['transitive@1.0.0'], undefined);
		assert.equal(output['@scope/scoped@1.0.0'], undefined);
	});

	it('keeps only root and direct dependencies at depth 0', async () => {
		const output = await runLicenseCheck({ direct: 0, start: root });

		assert.notEqual(output['fixture-root@1.0.0'], undefined);
		assert.notEqual(output['prod@1.0.0'], undefined);
		assert.notEqual(output['dev@1.0.0'], undefined);
		assert.notEqual(output['peer@1.0.0'], undefined);
		assert.notEqual(output['@scope/scoped@1.0.0'], undefined);
		assert.equal(output['transitive@1.0.0'], undefined);
	});

	it('continues to normalize --depth 0 to direct depth 0', () => {
		const normalizedArguments = args.setDefaultArguments({ depth: '0', start: root });

		assert.equal(normalizedArguments.direct, 0);
	});

	it('omits peer dependencies when nopeer is set', async () => {
		const output = await runLicenseCheck({ nopeer: true, start: root });

		assert.equal(output['peer@1.0.0'], undefined);
		assert.notEqual(output['prod@1.0.0'], undefined);
	});

	it('ignores missing optional dependencies and does not crash on missing required dependencies', async () => {
		const output = await runLicenseCheck({ start: root });

		assert.equal(output['missingOptional@1.0.0'], undefined);
		assert.equal(output['missingRequired@1.0.0'], undefined);
		assert.notEqual(output['fixture-root@1.0.0'], undefined);
	});

	it('rejects dependency tree read errors', async () => {
		await assert.rejects(
			runLicenseCheck({ start: path.join(root, 'does-not-exist') }),
			error => error instanceof Error
		);
	});
});
