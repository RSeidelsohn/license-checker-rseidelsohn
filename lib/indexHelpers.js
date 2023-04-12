/**
 * ! This function has a wanted sideeffect, as it modifies the json object that is passed by reference.
 *
 *  The depth attribute set in the options parameter here - which is defined by setting the `--direct` flag - is of
 *  no use with npm < 3, as the older npm versions flattened all dependencies into one single directory. So in
 *  order to making `--direct` work with older versions of npm, we need to filter out all non-dependencies from
 *  the json result.
 */
// TODO: Add tests for this function
const deleteNonDirectDependenciesFromAllDependencies = function deleteNonDirectDependenciesFromAllDependencies(
    { _dependencies: directDependencies, dependencies: allDependencies, devDependencies },
    options,
) {
    const allDependenciesArray = Object.keys(allDependencies);
    const directDependenciesArray = Object.keys(directDependencies);
    const devDependenciesArray = Object.keys(devDependencies);
    let wantedDependenciesArray = [];

    if (options.production && !options.development) {
        wantedDependenciesArray = directDependenciesArray.filter(
            (directDependency) => !devDependenciesArray.includes(directDependency),
        );
    } else if (!options.production && options.development) {
        wantedDependenciesArray = devDependenciesArray;
    } else {
        wantedDependenciesArray = directDependenciesArray;
    }

    allDependenciesArray.forEach((currentDependency) => {
        if (!wantedDependenciesArray.includes(currentDependency)) {
            delete allDependencies[currentDependency];
        }
    });
};

const getRepositoryUrl = function getRepositoryUrl({ clarificationRepository, jsonRepository }) {
    if (clarificationRepository) {
        return clarificationRepository;
    }

    if (typeof jsonRepository?.url === 'string') {
        return jsonRepository.url
            .replace('git+ssh://git@', 'git://')
            .replace('git+https://github.com', 'https://github.com')
            .replace('git://github.com', 'https://github.com')
            .replace('git@github.com:', 'https://github.com/')
            .replace(/\.git$/, '');
    }

    return undefined;
};

const getFirstNotUndefinedOrUndefined = function getFirstNotUndefinedOrUndefined() {
    for (let i = 0; i < arguments.length; i++) {
        if (typeof arguments[i] !== 'undefined') {
            return arguments[i];
        }
    }

    return undefined;
};

const getAuthorDetails = function getAuthorDetails({ clarification, author }) {
    let publisher = getFirstNotUndefinedOrUndefined(clarification?.publisher, author?.name);
    let email = getFirstNotUndefinedOrUndefined(clarification?.email, author?.email);
    let url = getFirstNotUndefinedOrUndefined(clarification?.url, author?.url);

    return { publisher, email, url };
};

module.exports = {
    deleteNonDirectDependenciesFromAllDependencies: deleteNonDirectDependenciesFromAllDependencies,
    getAuthorDetails: getAuthorDetails,
    getFirstNotUndefinedOrUndefined: getFirstNotUndefinedOrUndefined,
    getRepositoryUrl: getRepositoryUrl,
};
