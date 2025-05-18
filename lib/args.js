/*
Copyright (c) 2013, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://yuilibrary.com/license/
*/

import nopt from 'nopt';
import chalk from 'chalk';
import path from 'node:path';

// For the format requirements of "knownOptions", see the documentation for nopt: https://www.npmjs.com/package/nopt
const knownOptions = {
	angularCli: Boolean,
	clarificationsFile: path,
	clarificationsMatchAll: Boolean,
	color: Boolean,
	csv: Boolean,
	csvComponentPrefix: String,
	customFormat: {},
	customPath: path,
	depth: Number, // Meant to replace the misleading "--direct" option
	development: Boolean,
	direct: [String, null],
	excludeLicenses: String,
	excludePackages: String,
	excludePackagesStartingWith: String,
	excludePrivatePackages: Boolean,
	failOn: String,
	files: path,
	help: Boolean,
	includeLicenses: String,
	includePackages: String,
	json: Boolean,
	limitAttributes: String,
	markdown: Boolean,
	nopeer: Boolean,
	onlyAllow: String,
	onlyunknownOpts: Boolean,
	out: path,
	plainVertical: Boolean,
	production: Boolean,
	relativeLicensePath: Boolean,
	relativeModulePath: Boolean,
	start: String,
	summary: Boolean,
	unknownOpts: Boolean,
	version: Boolean,
};
// For the format requirements of "shortHands", see the documentation for nopt: https://www.npmjs.com/package/nopt
const shortHands = {
	h: ['--help'],
	v: ['--version'],
};

const parseArguments = function parseArguments(args) {
	// nopt is an option parser that returns an object looking like this, if you pass the params '--one --two here there -- --three --four':
	//
	// parsedArguments {
	//   one: true,
	//   two: true,
	//   argv: {
	//     remain: [ 'here', 'there', '--three', '--four' ],
	//     cooked: [ '--one', '--two', 'here', 'there', '--', '--three', '--four' ], // contains the expanded shorthand options
	//     original: [ '--one', '--two', 'here', 'there', '--', '--three', '--four' ]
	//   }
	// }
	const parsedArguments = nopt(knownOptions, shortHands, args);

	delete parsedArguments.argv;

	return parsedArguments;
};

/**
 * Converts a value for the "--direct" option into a number. The "--direct"
 * option is meant to accept either a Boolen or a Number. Either of those
 * values will then be taken for determining the depth:
 * - Passing in no value or leaving the parameter off will be interpreted as Infinity
 * - Passing in true will be interpreted as Infinity
 * - Passing in false will be interpreted as 0
 * - Passing in a number will be interpreted as that number
 * - Passing in any other value that can't be recognized as a number will be interpreted as Infinity
 *
 * @param {*} value
 * @returns Number
 */
const toDepthNumber = function toDepthNumber(value = Infinity) {
	let numberValue = 0;

	/* eslint-disable indent */
	switch (typeof value) {
		case 'string':
			numberValue = depthStringToNumber(value);
			break;
		case 'boolean':
			numberValue = value ? Infinity : 0;
			break;
		case 'number':
			numberValue = Math.max(0, value);
			break;
		default:
			numberValue = Infinity;
	}
	/* eslint-enable indent */

	return numberValue;
};

const depthStringToNumber = function depthStringToNumber(depthString) {
	let numberValue = depthString.toLowerCase();

	if (numberValue === 'true') {
		numberValue = Infinity;
	} else if (numberValue === 'false') {
		numberValue = 0;
	} else {
		numberValue = Number(numberValue, 10);

		if (Number.isNaN(numberValue)) {
			numberValue = Infinity;
		} else {
			numberValue = Math.max(0, numberValue);
		}
	}

	return numberValue;
};

const setDefaultArguments = function setDefaultArguments(parsedArguments = {}) {
	const argumentsWithDefaults = { ...parsedArguments };
	/*istanbul ignore else*/
	if (argumentsWithDefaults.color === null || argumentsWithDefaults.color === undefined) {
		argumentsWithDefaults.color = chalk.supportsColor;
	}

	if (argumentsWithDefaults.json || argumentsWithDefaults.markdown || argumentsWithDefaults.csv) {
		argumentsWithDefaults.color = false;
	}

	argumentsWithDefaults.start = argumentsWithDefaults.start ?? process.cwd();
	argumentsWithDefaults.relativeLicensePath = Boolean(argumentsWithDefaults.relativeLicensePath);
	argumentsWithDefaults.relativeModulePath = Boolean(argumentsWithDefaults.relativeModulePath);
	// "--depth" should replace "--direct", as it is better understandable:
	argumentsWithDefaults.direct = toDepthNumber(argumentsWithDefaults.depth ?? argumentsWithDefaults.direct);

	return argumentsWithDefaults;
};

const getNormalizedArguments = function getNormalizedArguments(args) {
	return setDefaultArguments(parseArguments(args));
};

export { knownOptions, getNormalizedArguments, setDefaultArguments, parseArguments };
