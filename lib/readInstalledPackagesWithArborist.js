import fs from 'node:fs';
import path from 'node:path';
import Arborist from '@npmcli/arborist';

const clonePackageJson = packageJson => JSON.parse(JSON.stringify(packageJson ?? {}));

const readPackageJsonFromDisk = packagePath => {
	try {
		return JSON.parse(fs.readFileSync(path.join(packagePath, 'package.json'), 'utf8'));
	} catch {
		return {};
	}
};

const getDependencySpecs = packageJson => ({
	...packageJson.dependencies,
	...packageJson.optionalDependencies,
});

const getRootDependencySpecs = (packageJson, options) => ({
	...getDependencySpecs(packageJson),
	...(options.nopeer ? {} : packageJson.peerDependencies),
	...packageJson.devDependencies,
});

const isOptionalEdge = edge => edge.type === 'optional' || edge.type === 'peerOptional';

const isPeerEdge = edge => edge.type === 'peer' || edge.type === 'peerOptional';

const getNodeForPackageJson = node => node.target ?? node;

const getNodeForDependencies = node => node.target ?? node;

const getRealPath = node => node.target?.realpath ?? node.realpath ?? node.path;

const getCompatibilityExtraneous = node => {
	const flagSource = node.target ?? node;

	return Boolean(flagSource.dev || node.dev);
};

const readInstalledPackagesWithArborist = (folder, options, callback) => {
	const convertTree = async () => {
		const normalizedOptions = options ?? {};
		const arb = new Arborist({ path: folder });
		const root = await arb.loadActual();
		const convertedNodes = new WeakMap();

		const convertNode = (node, parent = null, depth = 0) => {
			if (convertedNodes.has(node)) {
				return convertedNodes.get(node);
			}

			const packageNode = getNodeForPackageJson(node);
			const packageJson = {
				...clonePackageJson(packageNode.package),
				...readPackageJsonFromDisk(packageNode.path),
			};
			const dependencySpecs =
				node.root === node ? getRootDependencySpecs(packageJson, normalizedOptions) : getDependencySpecs(packageJson);
			const compatibilityPackageJson = {
				...packageJson,
				name: packageJson.name ?? node.name,
				version: packageJson.version ?? node.version,
				path: node.path,
				realPath: getRealPath(node),
				realName: node.name ?? packageJson.name,
				_dependencies: dependencySpecs,
				dependencies: {},
				extraneous: getCompatibilityExtraneous(node),
				root: node.root === node,
				depth,
			};

			if (node.isLink) {
				compatibilityPackageJson.link = true;
			}

			convertedNodes.set(node, compatibilityPackageJson);

			if (parent) {
				Object.defineProperty(compatibilityPackageJson, 'parent', {
					configurable: true,
					enumerable: false,
					value: parent,
					writable: true,
				});
			}

			const dependencyNode = getNodeForDependencies(node);

			for (const [childName, child] of dependencyNode.children) {
				if (normalizedOptions.nopeer && child.peer) {
					continue;
				}

				compatibilityPackageJson.dependencies[childName] = convertNode(child, compatibilityPackageJson, depth + 1);
			}

			for (const [dependencyName, edge] of dependencyNode.edgesOut) {
				if (normalizedOptions.nopeer && isPeerEdge(edge)) {
					continue;
				}

				if (!edge.to) {
					if (!isOptionalEdge(edge)) {
						compatibilityPackageJson.dependencies[dependencyName] = edge.spec;
					}
					continue;
				}

				const dependency = convertNode(edge.to, compatibilityPackageJson, depth + 1);

				if (!edge.valid) {
					if (isPeerEdge(edge)) {
						dependency.peerInvalid = true;
					} else {
						dependency.invalid = true;
					}
				}

				compatibilityPackageJson.dependencies[dependencyName] = dependency;
			}

			return compatibilityPackageJson;
		};

		return convertNode(root);
	};

	convertTree().then(convertedRoot => callback(null, convertedRoot), callback);
};

export default readInstalledPackagesWithArborist;
