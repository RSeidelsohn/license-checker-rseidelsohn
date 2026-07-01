import fs from 'node:fs';
import path from 'node:path';
import * as mkdirp from 'mkdirp';
import treeify from 'treeify';
import { getLicenseTitle } from '../getLicenseTitle.js';
import { getCsvData, getCsvHeaders, getModuleNameForLicenseTextHeader } from '../indexHelpers.js';
import { getFormattedOutput } from '../licenseCheckerHelpers.js';

export const asTree = sorted => treeify.asTree(sorted, true);

export const asSummary = sorted => {
	const licenseCountMap = new global.Map();
	const licenseCountArray = [];
	const sortedLicenseCountObj = {};

	Object.values(sorted).forEach(({ licenses }) => {
		if (licenses) {
			licenseCountMap.set(licenses, licenseCountMap.get(licenses) + 1 || 1);
		}
	});

	licenseCountMap.forEach((count, license) => {
		licenseCountArray.push({ license, count });
	});

	licenseCountArray
		.sort((a, b) => b.count - a.count)
		.forEach(({ license, count }) => {
			sortedLicenseCountObj[license] = count;
		});

	return treeify.asTree(sortedLicenseCountObj, true);
};

export const asCSV = (sorted, customFormat, csvComponentPrefix) => {
	const csvHeaders = getCsvHeaders(customFormat, csvComponentPrefix);
	const csvDataArr = getCsvData(sorted, customFormat, csvComponentPrefix);

	return [csvHeaders, ...csvDataArr].join('\n');
};

/**
 * Exports data as Markdown (*.md) which has its own syntax.
 *
 * @param  sorted                  The sorted JSON data from all packages.
 * @param  {object} [customFormat] The custom format with information about the needed keys.
 * @return {string}                The returning plain text.
 */
export const asMarkDown = (sorted, customFormat) => {
	const text = [];

	if (customFormat && Object.keys(customFormat).length > 0) {
		Object.keys(sorted).forEach(sortedItem => {
			text.push(`- **[${sortedItem}](${sorted[sortedItem].repository})**`);

			Object.keys(customFormat).forEach(customItem => {
				text.push(`    - ${customItem}: ${sorted[sortedItem][customItem]}`);
			});
		});
	} else {
		Object.keys(sorted).forEach(key => {
			const module = sorted[key];
			text.push(`- [${key}](${module.repository}) - ${module.licenses}`);
		});
	}

	return text.join('\n');
};

/**
 * Output data in plain vertical format like Angular CLI does: https://angular.io/3rdpartylicenses.txt
 */
export const asPlainVertical = sorted =>
	Object.entries(sorted)
		.map(([moduleName, moduleData]) => {
			let licenseText = getModuleNameForLicenseTextHeader(moduleName);

			if (Array.isArray(moduleData.licenses) && moduleData.licenses.length > 0) {
				// biome-ignore lint/suspicious/useIterableCallbackReturn: TODO we'll have to check if "moduleData.licenses" can contain something that might not be handled inside the map callback
				licenseText += moduleData.licenses.map(moduleLicense => {
					if (typeof moduleLicense === 'object') {
						return moduleLicense.type || moduleLicense.name;
					}

					if (typeof moduleLicense === 'string') {
						return moduleLicense;
					}
				});
			} else if (typeof moduleData.licenses === 'object' && (moduleData.licenses.type || moduleData.licenses.name)) {
				licenseText += getLicenseTitle(moduleData.licenses.type || moduleData.licenses.name);
			} else if (typeof moduleData.licenses === 'string') {
				licenseText += getLicenseTitle(moduleData.licenses);
			}

			licenseText += '\n';

			if (Array.isArray(moduleData.licenseFile) && moduleData.licenseFile.length > 0) {
				// biome-ignore lint/suspicious/useIterableCallbackReturn: TODO we'll have to check if "moduleData.licenseFile" can contain something that might not be handled inside the map callback
				licenseText += moduleData.licenseFile.map(moduleLicense => {
					if (typeof moduleLicense === 'object') {
						return moduleLicense.type || moduleLicense.name;
					}

					if (typeof moduleLicense === 'string') {
						return moduleLicense;
					}
				});
			} else if (
				typeof moduleData.licenseFile === 'object' &&
				(moduleData.licenseFile.type || moduleData.licenseFile.name)
			) {
				licenseText += moduleData.licenseFile.type || moduleData.licenseFile.name;
			} else if (typeof moduleData.licenseFile === 'string') {
				licenseText += fs.readFileSync(moduleData.licenseFile, { encoding: 'utf8' });
			}

			return licenseText;
		})
		.join('\n\n');

export const asFiles = (json, outDir) => {
	mkdirp.sync(outDir);

	Object.keys(json).forEach(moduleName => {
		const licenseFile = json[moduleName].licenseFile;

		if (licenseFile && fs.existsSync(licenseFile)) {
			const fileContents = fs.readFileSync(licenseFile);
			const outPath = path.join(outDir, `${moduleName}-LICENSE.txt`);
			const baseDir = path.dirname(outPath);

			mkdirp.sync(baseDir);
			fs.writeFileSync(outPath, fileContents, 'utf8');
		} else {
			console.warn(`No license file found for module '${moduleName}'`);
		}
	});
};

/**
 * Write output to a file, if indicated in parsedArgs.
 */
export const writeOutput = (parsedArgs, foundLicensesJson) => {
	if (parsedArgs.files || parsedArgs.out) {
		const formattedOutput = getFormattedOutput(foundLicensesJson, parsedArgs);

		if (parsedArgs.files) {
			asFiles(foundLicensesJson, parsedArgs.files);
		}

		if (parsedArgs.out) {
			const dir = path.dirname(parsedArgs.out);

			mkdirp.sync(dir);
			fs.writeFileSync(parsedArgs.out, formattedOutput, 'utf8');
		}
	}
};
