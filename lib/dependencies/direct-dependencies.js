/**
 * This function has a wanted side effect, as it modifies the package tree that is passed by reference.
 *
 * The depth attribute set in the options parameter here - which is defined by setting the `--direct` flag - is of
 * no use with npm < 3, as the older npm versions flattened all dependencies into one single directory. So in
 * order to make `--direct` work with older versions of npm, we need to filter out all non-dependencies from
 * the result.
 */
export function deleteNonDirectDependencies(
	{ _dependencies: directDependencies = {}, dependencies: allDependencies = {}, devDependencies = {} },
	options
) {
	const allDependenciesArray = Object.keys(allDependencies);
	const directDependenciesArray = Object.keys(directDependencies);
	const devDependenciesArray = Object.keys(devDependencies);
	let wantedDependenciesArray = [];

	if (options.production && !options.development) {
		wantedDependenciesArray = directDependenciesArray.filter(
			directDependency => !devDependenciesArray.includes(directDependency)
		);
	} else if (!options.production && options.development) {
		wantedDependenciesArray = devDependenciesArray;
	} else {
		wantedDependenciesArray = directDependenciesArray;
	}

	allDependenciesArray.forEach(currentDependency => {
		if (!wantedDependenciesArray.includes(currentDependency)) {
			delete allDependencies[currentDependency];
		}
	});
}
