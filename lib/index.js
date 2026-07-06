import path from 'node:path';
import chalk from 'chalk';
import debug from 'debug';
import { deleteNonDirectDependencies } from './dependencies/direct-dependencies.js';
import readInstalledPackages from './dependencies/read-installed-packages.js';
import { readJson } from './files/read-json.js';
import { assertAllClarificationsWereUsed, readClarifications } from './licenses/clarifications.js';
import { collectLicenseResults } from './licenses/collect-license-results.js';
import { getFormattedOutput } from './output/format-output.js';
import { writeIndividualLicenseFilesToDir, writeOutputToFile } from './output/write-output.js';
import { getLicenseMatch, getLicensePolicy, throwIfLicensePolicyFails } from './policies/license-policy.js';
import {
	excludePackages,
	excludePackagesStartingWith,
	excludePrivatePackages,
	getOptionArray,
	includePackages,
} from './policies/package-filters.js';

const LICENSE_TITLE_UNKNOWN = 'UNKNOWN';
const LICENSE_TITLE_UNLICENSED = 'UNLICENSED';

// Set up debug logging
// https://www.npmjs.com/package/debug#stderr-vs-stdout
const debugError = debug('license-checker-rseidelsohn:error');
const debugLog = debug('license-checker-rseidelsohn:log');

debugLog.log = console.log.bind(console);

/**
 * Custom output field default value or toggle.
 *
 * For CSV output, custom format keys define the output columns after module_name.
 * For JSON output, custom format keys add or populate fields in addition to the usual result fields.
 * A value of false disables optional population for that field where supported, but does not remove core fields such as
 * licenses.
 *
 * Use limitAttributes to restrict formatted JSON output to a specific set of fields.
 *
 * @typedef {(string | boolean | undefined)} CustomFormatValue
 */

/**
 * @typedef {Record<string, CustomFormatValue>} CustomFormat
 */

/**
 * @typedef {Object} LicenseCheckOptions Options struct for the init() and runLicenseCheck() functions.
 * @property {string} start Path to start checking dependencies from.
 * @property {boolean=} production Only show production dependencies.
 * @property {boolean=} development Only show development dependencies.
 * @property {boolean=} unknown Report guessed licenses as unknown licenses.
 * @property {boolean=} onlyunknown Only list packages with unknown or guessed licenses.
 * @property {boolean=} json Output in JSON format.
 * @property {boolean=} csv Output in CSV format.
 * @property {string=} csvComponentPrefix Prefix column for component in CSV format.
 * @property {string=} out Write the data to a specific file.
 * @property {string=} customPath Path to a JSON file that defines a custom output format.
 * @property {string=} excludeLicenses Exclude modules which licenses are in the comma-separated list from the output.
 * @property {boolean=} relativeLicensePath Output the location of the license files as relative paths.
 * @property {boolean=} relativeModulePath Output module locations as relative paths.
 * @property {boolean=} summary Output a summary of the license usage.
 * @property {string=} failOn Fail (exit with code 1) on the first occurrence of the licenses of the semicolon-separated list.
 * @property {string=} onlyAllow Fail (exit with code 1) on the first occurrence of the licenses not in the semicolon-separated list.
 * @property {string=} includePackages Restrict output to the packages (package@version) in the semicolon-separated list.
 * @property {string=} excludePackages Restrict output to the packages (package@version) not in the semicolon-separated list.
 * @property {boolean=} excludePrivatePackages Restrict output to not include any package marked as private.
 * @property {string=} excludePackagesStartingWith Exclude modules starting with a specific string.
 * @property {(boolean | number)=} direct Look for direct dependencies only.
 * @property {number=} depth Recurse dependencies up to a specific depth, overrides "direct".
 * @property {boolean=} color Colorize output.
 * @property {CustomFormat=} customFormat Custom output fields and default values.
 * @property {boolean=} nopeer Ignore peerDependencies.
 * @property {string=} clarificationsFile A file that contains license clarifications for malformed or non-standard packages.
 * @property {boolean=} clarificationsMatchAll Require every clarification to match a package.
 * @property {string=} includeLicenses Include modules which licenses are in the comma-separated list in the output.
 * @property {string=} files Path to write output files to.
 */

/**
 * @typedef {Object} KnownModuleInfo Information about one dependency.
 * @property {string=} name Module name.
 * @property {string=} version Module version.
 * @property {string=} description Module description.
 * @property {string=} repository Repository URL.
 * @property {string=} publisher Publisher name.
 * @property {string=} email Publisher e-mail.
 * @property {string=} url Publisher URL.
 * @property {(string | string[])=} licenses Detected license(s).
 * @property {string=} licenseFile Path to license file, if available.
 * @property {string=} licenseText Contents of the license.
 * @property {string=} licenseModified Whether the license is modified.
 * @property {boolean=} private Private module.
 * @property {string=} path Path to module.
 * @property {boolean=} relativeModulePath Output module locations as relative paths.
 * @property {string=} copyright Copyright statements.
 * @property {string=} noticeFile Path of NOTICE file.
 */

/**
 * @typedef {KnownModuleInfo & Record<string, string | string[] | boolean | undefined>} ModuleInfo
 */

/**
 * @typedef {Record<string, ModuleInfo>} ModuleInfos
 */

/**
 * Checks licenses based on the given options.
 *
 * @param {LicenseCheckOptions} options Controls the license checker's behavior.
 * @returns {Promise<ModuleInfos>} All information on dependencies found by the license checker.
 */
export const runLicenseCheck = async options => {
	debugLog('scanning %s', options.start);

	// customPath is a path to a JSON file that defined a custom format
	if (options.customPath) {
		options.customFormat = readJson(options.customPath);
	}

	const optionsForReadingInstalledPackages = {
		depth: options.direct, // How deep to traverse the dependency tree
		nopeer: options.nopeer, // Whether to skip peerDependencies in output
		dev: true, // Whether to include devDependencies
		log: debugLog, // A function to log debug info
	};

	if (options.production || options.development) {
		optionsForReadingInstalledPackages.dev = false;
	}

	const { failOnLicenses, onlyAllowLicenses } = getLicensePolicy(options);

	// An object mapping from Package name -> list of what contents it should have, including a semver range for each entry
	const clarifications = readClarifications(options.clarificationsFile);

	let installedPackagesJson;
	try {
		installedPackagesJson = await readInstalledPackages(options.start, optionsForReadingInstalledPackages);
	} catch (error) {
		debugError(error);
		throw error;
	}

	// Good to know:
	// The json object returned by readInstalledPackages stores all direct dependencies from
	// the package.json file in the property '_dependencies'. The property 'dependencies' contains all dependencies,
	// including the ones that are only required by other dependencies.
	if (optionsForReadingInstalledPackages.depth === 0) {
		deleteNonDirectDependencies(installedPackagesJson, options);
	}

	// 'results' might be longer than 'installedPackagesJson.dependencies', as it appends the version numbers to each key (package name),
	// e.g. 'grunt@1' instead of 'grunt', and this way contains all different installed versions of each package:
	let results = collectLicenseResults({
		args: options,
		basePath: options.relativeLicensePath ? installedPackagesJson.path : null,
		clarifications,
		customFormat: options.customFormat,
		development: options.development,
		direct: options.direct,
		production: options.production,
		rootPackage: installedPackagesJson,
		unknown: options.unknown,
	});

	if (options.clarificationsMatchAll) {
		assertAllClarificationsWereUsed(clarifications);
	}

	const colorize = options.color;
	const sorted = {}; // 'sorted' will store the same items as results, but sorted by package name and version
	let resultJson = {};
	const excludeLicenses = options.excludeLicenses
		?.match(/([^\\\][^,]|\\,)+/g)
		.map(license => license.replace(/\\,/g, ',').replace(/^\s+|\s+$/g, ''));
	const includeLicenses = options.includeLicenses
		?.match(/([^\\\][^,]|\\,)+/g)
		.map(license => license.replace(/\\,/g, ',').replace(/^\s+|\s+$/g, ''));

	const colorizeString = string => (colorize ? chalk.bold.red(string) : string);

	// This following block stores the licenses in the sorted object (before, the sorted object is the empty object):
	Object.keys(results)
		.sort()
		.forEach(item => {
			if (results[item].private) {
				results[item].licenses = colorizeString(LICENSE_TITLE_UNLICENSED);
			}

			if (!results[item].licenses) {
				results[item].licenses = colorizeString(LICENSE_TITLE_UNKNOWN);
			}

			if (
				options.unknown &&
				results[item].licenses &&
				results[item].licenses !== LICENSE_TITLE_UNKNOWN &&
				results[item].licenses.indexOf('*') > -1
			) {
				results[item].licenses = colorizeString(LICENSE_TITLE_UNKNOWN);
			}

			if (results[item]) {
				if (options.relativeModulePath && results[item].path != null) {
					results[item].path = path.relative(options.start, results[item].path);
				}

				if (options.onlyunknown) {
					if (results[item].licenses.indexOf('*') > -1 || results[item].licenses.indexOf(LICENSE_TITLE_UNKNOWN) > -1) {
						sorted[item] = results[item];
					}
				} else {
					sorted[item] = results[item];
				}
			}
		});

	// 'results' is not needed anymore:
	results = null;

	let noPackagesFoundError;
	if (!Object.keys(sorted).length) {
		noPackagesFoundError = new Error('No packages found in this path...');
	}

	// This following block stores the entries from the 'sorted' object in the
	// resultJson object (before, the resultJson object is the empty object):
	if (
		(!Array.isArray(excludeLicenses) || excludeLicenses.length === 0) &&
		(!Array.isArray(includeLicenses) || includeLicenses.length === 0)
	) {
		resultJson = { ...sorted };
	} else {
		if (Array.isArray(excludeLicenses) && excludeLicenses.length > 0) {
			Object.entries(sorted).forEach(([packageName, packageData]) => {
				const { licenses } = packageData;

				if (!licenses) {
					resultJson[packageName] = packageData;
				} else {
					const licensesArr = Array.isArray(licenses) ? licenses : [licenses];
					const licenseMatch = getLicenseMatch(licensesArr, excludeLicenses);

					if (licenseMatch.hasUnknownLicense || !licenseMatch.match) {
						resultJson[packageName] = packageData;
					}
				}
			});
		}

		if (Array.isArray(includeLicenses) && includeLicenses.length > 0) {
			Object.entries(sorted).forEach(([packageName, packageData]) => {
				const { licenses } = packageData;

				if (!licenses) {
					resultJson[packageName] = packageData;
				} else {
					const licensesArr = Array.isArray(licenses) ? licenses : [licenses];
					const licenseMatch = getLicenseMatch(licensesArr, includeLicenses);

					if (licenseMatch.hasUnknownLicense || licenseMatch.match) {
						resultJson[packageName] = packageData;
					}
				}
			});
		}
	}

	// package whitelist
	const whitelist = getOptionArray(options.includePackages);
	if (whitelist) {
		resultJson = includePackages(whitelist, resultJson);
	}

	// package blacklist
	const blacklist = getOptionArray(options.excludePackages);
	if (blacklist) {
		resultJson = excludePackages(blacklist, resultJson);
	}

	// exclude by package name starting with a string
	const excludeStartStringsArr = getOptionArray(options.excludePackagesStartingWith);
	if (excludeStartStringsArr) {
		resultJson = excludePackagesStartingWith(excludeStartStringsArr, resultJson);
	}

	if (options.excludePrivatePackages) {
		resultJson = excludePrivatePackages(resultJson);
	}

	Object.keys(resultJson).forEach(packageName => {
		throwIfLicensePolicyFails({
			currentLicense: resultJson[packageName]?.licenses,
			failOnLicenses,
			onlyAllowLicenses,
			packageName,
		});
	});

	if (noPackagesFoundError) {
		debugError(noPackagesFoundError);
		throw noPackagesFoundError;
	}

	if (options.out) {
		await writeOutputToFile(options.out, getFormattedOutput(resultJson, options));
	}

	if (options.files) {
		await writeIndividualLicenseFilesToDir(options.files, resultJson);
	}

	return resultJson;
};

/**
 * Runs the license check for the given args.
 *
 * @param {LicenseCheckOptions} args Specifies the path to the module to check dependencies of.
 * @param {(err: Error | null, ret: ModuleInfos) => void} callback Called after the checker finished.
 * @deprecated Will be removed in a future version. Please switch to {@link runLicenseCheck} instead.
 */
export const init = (args, callback) => {
	runLicenseCheck(args).then(
		result => callback(null, result),
		error => callback(error, {})
	);
};
