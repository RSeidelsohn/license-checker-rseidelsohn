import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import semver from 'semver';
import { walkDependencyTree } from '../dependencies/walk-dependency-tree.js';
import { firstDefined } from '../shared/first-defined.js';
import { getCopyrightLines } from './copyright.js';
import { detectLicenseTitle } from './detect-license-title.js';
import { findLicenseFiles } from './find-license-files.js';
import { getAuthorDetails, getRepositoryUrl, storeReadmeInPackageJsonIfExists } from './package-metadata.js';

const LICENSE_TITLE_UNKNOWN = 'UNKNOWN';
const INITIAL_MODULE_INFO = { licenses: LICENSE_TITLE_UNKNOWN };

const getPackageNameAndVersion = packageJson => `${packageJson.name}@${packageJson.version}`;

const findClarification = (clarifications, packageJson) =>
	clarifications[packageJson.name]?.find(
		clarification =>
			packageJson.version === clarification.semverRange ||
			semver.satisfies(packageJson.version, clarification.semverRange)
	);

const shouldSkipPackage = ({ packageJson, data, options }) =>
	data[getPackageNameAndVersion(packageJson)] ||
	(options.production && packageJson.extraneous) ||
	(options.development && !packageJson.extraneous && !packageJson.root);

const collectPackageLicenseInfo = ({ packageJson: currentExtendedPackageJson, data, options }) => {
	const moduleInfo = { ...INITIAL_MODULE_INFO };
	const currentPackageNameAndVersion = getPackageNameAndVersion(currentExtendedPackageJson);

	let licenseFilesInCurrentModuleDirectory = [];
	let licenseData;
	let licenseFile;
	let noticeFiles = [];
	const clarification = findClarification(options.clarifications, currentExtendedPackageJson);
	let passedClarificationCheck = !clarification?.checksum;
	if (clarification) {
		clarification.used = true;
	}

	if (shouldSkipPackage({ packageJson: currentExtendedPackageJson, data, options })) {
		return false;
	}

	if (currentExtendedPackageJson.private) {
		moduleInfo.private = true;
	}

	data[currentPackageNameAndVersion] = moduleInfo;

	// Include property in output unless custom format has set property explicitly to false:
	const mustInclude = (propertyName = '') => options?.customFormat?.[propertyName] !== false;

	if (mustInclude('repository')) {
		const repositoryUrl = getRepositoryUrl({
			clarificationRepository: clarification?.repository,
			jsonRepository: currentExtendedPackageJson?.repository,
		});

		if (repositoryUrl) {
			moduleInfo.repository = repositoryUrl;
		}
	}

	if (mustInclude('url')) {
		// TODO: Figure out where the check for currentExtendedPackageJson.url.web comes from. It's in the original license-checker,
		//       but I can't find any documentation on it.
		const url = firstDefined(clarification?.url, currentExtendedPackageJson?.url?.web);
		if (url) {
			moduleInfo.url = url;
		}
	}

	if (typeof currentExtendedPackageJson.author === 'object') {
		const { publisher, email, url } = getAuthorDetails({
			clarification,
			author: currentExtendedPackageJson?.author,
		});

		if (mustInclude('publisher') && publisher) {
			moduleInfo.publisher = publisher;
		}

		if (mustInclude('email') && email) {
			moduleInfo.email = email;
		}

		// moduleInfo.url can for some reason already be set to currentExtendedPackageJson.url.web further up in the code,
		// so we only set it if it's not already set.
		if (typeof moduleInfo.url !== 'undefined' && mustInclude('url') && url) {
			moduleInfo.url = url;
		}
	}

	if (options.unknown) {
		moduleInfo.dependencyPath = currentExtendedPackageJson.path;
	}

	const modulePath = firstDefined(clarification?.path, currentExtendedPackageJson?.path);
	if (mustInclude('path') && typeof modulePath === 'string') {
		moduleInfo.path = modulePath;
	}

	// Eventually store the contents of the module's README.md in currentExtendedPackageJson.readme:
	storeReadmeInPackageJsonIfExists(modulePath, currentExtendedPackageJson);

	// Try to get the license information from the clarification file or from the package.json file:
	licenseData = firstDefined(
		clarification?.licenses,
		currentExtendedPackageJson.license,
		currentExtendedPackageJson.licenses
	);

	if (licenseData) {
		// License information has been collected from either the clarification file or from the package.json file
		if (Array.isArray(licenseData) && licenseData.length > 0) {
			// biome-ignore lint/suspicious/useIterableCallbackReturn: TODO we'll have to check if "licenseData" can contain something that might not be handled inside the map callback
			moduleInfo.licenses = licenseData.map(moduleLicense => {
				const moduleLicenseTypeOrName = firstDefined(moduleLicense.type, moduleLicense.name);

				if (typeof moduleLicenseTypeOrName === 'string') {
					return moduleLicenseTypeOrName;
				}

				if (typeof moduleLicense === 'string') {
					return moduleLicense;
				}
			});
		} else if (typeof firstDefined(licenseData.type, licenseData.name) === 'string') {
			moduleInfo.licenses = detectLicenseTitle(firstDefined(licenseData.type, licenseData.name));
		} else if (typeof licenseData === 'string') {
			moduleInfo.licenses = detectLicenseTitle(licenseData);
		}
	} else if (detectLicenseTitle(currentExtendedPackageJson.readme)) {
		// Try to get the license information from the README file if neither the clarification file nor the package.json
		// file contained any license information:
		moduleInfo.licenses = detectLicenseTitle(currentExtendedPackageJson.readme);
	}

	if (Array.isArray(moduleInfo.licenses)) {
		if (moduleInfo.licenses.length === 1) {
			moduleInfo.licenses = moduleInfo.licenses[0];
		}
	}

	if (clarification?.licenseFile) {
		licenseFilesInCurrentModuleDirectory = [clarification.licenseFile];
	} else if (modulePath && fs.existsSync(modulePath)) {
		const filesInModuleDirectory = fs.readdirSync(modulePath);
		licenseFilesInCurrentModuleDirectory = findLicenseFiles(filesInModuleDirectory);

		noticeFiles = filesInModuleDirectory.filter(filename => {
			const uppercased = filename.toUpperCase();
			const name = path.basename(uppercased).replace(path.extname(uppercased), '');
			return name === 'NOTICE';
		});
	}

	licenseFilesInCurrentModuleDirectory.forEach(function findBetterLicenseData(filename, index) {
		licenseFile = path.join(modulePath, filename);
		// Checking that the file is in fact a normal file and not a directory for example.
		if (fs.lstatSync(licenseFile).isFile()) {
			let currentLicenceFilesContent;

			if (
				!moduleInfo.licenses ||
				moduleInfo.licenses.indexOf(LICENSE_TITLE_UNKNOWN) > -1
				// TODO: Should we override a custom license?
				// || moduleInfo.licenses.indexOf('Custom:') === 0
			) {
				//Only re-check the license if we didn't get it from elsewhere
				currentLicenceFilesContent = fs.readFileSync(licenseFile, { encoding: 'utf8' });

				moduleInfo.licenses = detectLicenseTitle(currentLicenceFilesContent);
			}

			if (index === 0) {
				// Treat the file with the highest precedence as licenseFile
				if (clarification !== undefined && !passedClarificationCheck) {
					if (!currentLicenceFilesContent) {
						currentLicenceFilesContent = fs.readFileSync(licenseFile, { encoding: 'utf8' });
					}

					const sha256 = createHash('sha256').update(currentLicenceFilesContent).digest('hex');
					if (clarification.checksum !== sha256) {
						throw new Error(
							`Clarification checksum mismatch for ${currentPackageNameAndVersion} :(\nFile checked: ${licenseFile}`
						);
					}

					passedClarificationCheck = true;
				}

				if (mustInclude('licenseFile')) {
					moduleInfo.licenseFile = firstDefined(
						clarification?.licenseFile,
						options.basePath ? path.relative(options.basePath, licenseFile) : licenseFile
					);
				}

				if (mustInclude('licenseText') && options.customFormat) {
					if (clarification?.licenseText) {
						moduleInfo.licenseText = clarification.licenseText;
					} else {
						if (!currentLicenceFilesContent) {
							currentLicenceFilesContent = fs.readFileSync(licenseFile, { encoding: 'utf8' });
						}

						if (options.args && !options.args.csv) {
							moduleInfo.licenseText = currentLicenceFilesContent.trim();
						} else {
							moduleInfo.licenseText = currentLicenceFilesContent
								.replace(/"/g, "'")
								.replace(/\r?\n|\r/g, ' ')
								.trim();
						}
					}

					if (clarification?.licenseStart) {
						const startIndex = moduleInfo.licenseText.indexOf(clarification.licenseStart);
						let endIndex;

						if (clarification?.licenseEnd) {
							endIndex = moduleInfo.licenseText.indexOf(clarification.licenseEnd, startIndex);
						} else {
							endIndex = moduleInfo.licenseText.length;
						}

						moduleInfo.licenseText = moduleInfo.licenseText.substring(startIndex, endIndex);
					}
				}

				if (mustInclude('copyright') && options.customFormat) {
					if (clarification?.copyright) {
						moduleInfo.copyright = clarification.copyright;
					} else {
						if (!currentLicenceFilesContent) {
							currentLicenceFilesContent = fs.readFileSync(licenseFile, { encoding: 'utf8' });
						}

						const linesWithCopyright = getCopyrightLines(currentLicenceFilesContent);

						if (linesWithCopyright.length > 0) {
							moduleInfo.copyright = linesWithCopyright[0].replace(/\n/g, '. ').trim();
						}

						// Mark files with multiple copyright statements. This might be
						// an indicator to take a closer look at the LICENSE file.
						if (linesWithCopyright.length > 1) {
							moduleInfo.copyright = `${moduleInfo.copyright}*`;
						}
					}
				}
			}
		}
	});

	if (!passedClarificationCheck) {
		throw new Error('All clarifications must come with a checksum');
	}

	// TODO: How do clarifications interact with notice files?
	noticeFiles.forEach(filename => {
		const file = path.join(currentExtendedPackageJson.path, filename);
		if (fs.lstatSync(file).isFile()) {
			moduleInfo.noticeFile = options.basePath ? path.relative(options.basePath, file) : file;
		}
	});

	if (!currentExtendedPackageJson.name || !currentExtendedPackageJson.version) {
		delete data[currentPackageNameAndVersion];
	}

	if (options.customFormat) {
		Object.keys(options.customFormat).forEach(customFormatKey => {
			if (mustInclude(customFormatKey) && moduleInfo[customFormatKey] === undefined) {
				moduleInfo[customFormatKey] = firstDefined(
					clarification?.[customFormatKey],
					typeof currentExtendedPackageJson[customFormatKey] === 'string'
						? currentExtendedPackageJson[customFormatKey]
						: options.customFormat[customFormatKey]
				);
			}
		});
	}

	return true;
};

/**
 * @param {{
 *   args?: Record<string, unknown>,
 *   basePath?: string | null,
 *   clarifications?: Record<string, Array<Record<string, unknown>>>,
 *   customFormat?: Record<string, unknown>,
 *   development?: boolean,
 *   direct?: number | boolean | string | null,
 *   production?: boolean,
 *   rootPackage: Record<string, unknown>,
 *   unknown?: boolean
 * }} options
 * @returns {Record<string, Record<string, unknown>>}
 */
export const collectLicenseResults = ({
	args,
	basePath,
	clarifications = {},
	customFormat,
	development,
	direct,
	production,
	rootPackage,
	unknown,
}) => {
	const data = {};
	const options = { args, basePath, clarifications, customFormat, development, production, unknown };

	walkDependencyTree(rootPackage, {
		maxDepth: direct,
		shouldVisit: dependency => !data[getPackageNameAndVersion(dependency)],
		visit: packageJson => collectPackageLicenseInfo({ packageJson, data, options }),
	});

	return data;
};
