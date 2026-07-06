import fs from 'node:fs';
import treeify from 'treeify';
import { detectLicenseTitle } from '../licenses/detect-license-title.js';

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

const getModuleNameForLicenseTextHeader = (moduleName = '') => {
	const lastIndexOfAtCharacter = moduleName.lastIndexOf('@');

	return `${moduleName.substring(0, lastIndexOfAtCharacter)} ${moduleName.substring(lastIndexOfAtCharacter + 1)}\n`;
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
				licenseText += detectLicenseTitle(moduleData.licenses.type || moduleData.licenses.name);
			} else if (typeof moduleData.licenses === 'string') {
				licenseText += detectLicenseTitle(moduleData.licenses);
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
