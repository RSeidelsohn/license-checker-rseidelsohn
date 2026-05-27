import Arborist from '@npmcli/arborist';
import PackageJson from '@npmcli/package-json';

const clonePackageJson = packageJson => JSON.parse(JSON.stringify(packageJson ?? {}));

const readPackageJsonFromDisk = async packagePath => {
	try {
		const packageJson = await PackageJson.prepare(packagePath);
		return clonePackageJson(packageJson.content);
	} catch {
		return {};
	}
};

const getDependencySpecs = packageJson => ({
	...packageJson.dependencies,
	...packageJson.optionalDependencies,
});

const getRootDependencySpecs = packageJson => ({
	...getDependencySpecs(packageJson),
});

const isOptionalEdge = edge => edge.type === 'optional' || edge.type === 'peerOptional';

const isPeerEdge = edge => edge.type === 'peer' || edge.type === 'peerOptional';

const getNodeForPackageJson = node => node.target ?? node;

const getNodeForDependencies = node => node.target ?? node;

const getRealPath = node => node.target?.realpath ?? node.realpath ?? node.path;

const findDependency = (packageJson, dependencyName) => {
	let currentPackageJson = packageJson;

	while (currentPackageJson) {
		const dependency = currentPackageJson.dependencies?.[dependencyName];

		if (typeof dependency === 'object') {
			return dependency;
		}

		if (currentPackageJson.realName === dependencyName) {
			return currentPackageJson;
		}

		currentPackageJson = currentPackageJson.link ? null : currentPackageJson.parent;
	}
};

const unmarkExtraneous = (packageJson, options) => {
	packageJson.extraneous = false;

	const dependencies = packageJson._dependencies ?? {};

	if (options.dev && packageJson.devDependencies && (packageJson.root || packageJson.link)) {
		Object.keys(packageJson.devDependencies).forEach(dependencyName => {
			dependencies[dependencyName] = packageJson.devDependencies[dependencyName];
		});
	}

	if (!options.nopeer && packageJson.peerDependencies) {
		Object.keys(packageJson.peerDependencies).forEach(dependencyName => {
			dependencies[dependencyName] = packageJson.peerDependencies[dependencyName];
		});
	}

	Object.keys(dependencies).forEach(dependencyName => {
		const dependency = findDependency(packageJson, dependencyName);

		if (dependency?.extraneous) {
			unmarkExtraneous(dependency, options);
		}
	});
};

const readInstalledPackagesWithArborist = (folder, options, callback) => {
	const convertTree = async () => {
		const normalizedOptions = options ?? {};
		const arb = new Arborist({ path: folder });
		const root = await arb.loadActual();
		const convertedNodes = new WeakMap();

		const convertNode = async (node, parent = null, depth = 0, realName = null) => {
			if (convertedNodes.has(node)) {
				return convertedNodes.get(node);
			}

			const packageNode = getNodeForPackageJson(node);
			const packageJson = {
				...clonePackageJson(packageNode.package),
				...(await readPackageJsonFromDisk(packageNode.path)),
			};
			const dependencySpecs =
				node.root === node ? getRootDependencySpecs(packageJson) : getDependencySpecs(packageJson);
			const compatibilityPackageJson = {
				...packageJson,
				name: packageJson.name ?? node.name,
				version: packageJson.version ?? node.version,
				path: node.path,
				realPath: getRealPath(node),
				realName: realName ?? packageJson.name ?? node.name,
				_dependencies: dependencySpecs,
				dependencies: {},
				extraneous: true,
				depth,
			};

			if (compatibilityPackageJson.realName && compatibilityPackageJson.name !== compatibilityPackageJson.realName) {
				compatibilityPackageJson.invalid = true;
			}

			if (node.isLink) {
				compatibilityPackageJson.link = getRealPath(node);
			}

			convertedNodes.set(node, compatibilityPackageJson);

			if (parent && !compatibilityPackageJson.link) {
				compatibilityPackageJson.parent = parent;
			}

			const dependencyNode = getNodeForDependencies(node);

			for (const [childName, child] of dependencyNode.children) {
				if (normalizedOptions.nopeer && child.peer) {
					continue;
				}

				compatibilityPackageJson.dependencies[childName] = await convertNode(
					child,
					compatibilityPackageJson,
					depth + 1,
					childName
				);
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

				const dependency = await convertNode(edge.to, compatibilityPackageJson, depth + 1, dependencyName);

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

		const convertedRoot = await convertNode(root);
		convertedRoot.root = true;
		unmarkExtraneous(convertedRoot, normalizedOptions);

		return convertedRoot;
	};

	convertTree().then(convertedRoot => callback(null, convertedRoot), callback);
};

export default readInstalledPackagesWithArborist;
