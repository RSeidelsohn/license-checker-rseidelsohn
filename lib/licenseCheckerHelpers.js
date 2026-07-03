import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import cloneDeep from 'lodash.clonedeep';
import { filterAttributes } from './util/filterAttributes.js';
import { asCSV, asMarkDown, asPlainVertical, asSummary, asTree } from './util/output.js';

export function shouldColorizeOutput(args) {
	return args.color && !args.out && !args.files && !(args.csv || args.json || args.markdown || args.plainVertical);
}

export function colorizeOutput(json) {
	Object.keys(json).forEach(key => {
		const index = key.lastIndexOf('@');
		const colorizedKey =
			chalk.white.bgHex('#2F4F4F')(key.slice(0, index)) +
			chalk.dim('@') +
			chalk.white.bgHex('#008000')(key.slice(index + 1));
		json[colorizedKey] = json[key];

		delete json[key];
	});
}

function filterJson(limitAttributes, json) {
	let filteredJson = json;

	if (limitAttributes) {
		filteredJson = {};
		const attributes = limitAttributes.split(',').map(attribute => attribute.trim());

		Object.keys(json).forEach(dependency => {
			filteredJson[dependency] = filterAttributes(attributes, json[dependency]);
		});
	}

	return filteredJson;
}

export function getFormattedOutput(modulesWithVersions, args) {
	let filteredJson = filterJson(args.limitAttributes, modulesWithVersions);
	const jsonCopy = cloneDeep(filteredJson);
	filteredJson = null;

	if (args.files) {
		Object.keys(jsonCopy).forEach(moduleName => {
			const outPath = path.join(args.files, `${moduleName}-LICENSE.txt`);
			const originalLicenseFile = jsonCopy[moduleName].licenseFile;

			if (originalLicenseFile && fs.existsSync(originalLicenseFile)) {
				if (args.relativeLicensePath) {
					if (args.out) {
						jsonCopy[moduleName].licenseFile = path.relative(path.dirname(args.out), outPath);
					} else {
						jsonCopy[moduleName].licenseFile = path.relative(process.cwd(), outPath);
					}
				} else {
					jsonCopy[moduleName].licenseFile = outPath;
				}
			}
		});
	}

	if (args.json) {
		return `${JSON.stringify(jsonCopy, null, 4)}\n`;
	}

	if (args.csv) {
		return asCSV(jsonCopy, args.customFormat, args.csvComponentPrefix);
	}

	if (args.markdown) {
		return `${asMarkDown(jsonCopy, args.customFormat)}\n`;
	}

	if (args.summary) {
		return asSummary(jsonCopy);
	}

	if (args.plainVertical || args.angluarCli) {
		return asPlainVertical(jsonCopy);
	}

	return asTree(jsonCopy);
}
