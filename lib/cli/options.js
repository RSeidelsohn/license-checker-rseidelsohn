import path from 'node:path';
import { supportsColor } from 'chalk';
import nopt from 'nopt';

// For the format requirements of "knownOptions", see the documentation for nopt: https://www.npmjs.com/package/nopt
export const knownOptions = {
	angularCli: Boolean,
	clarificationsFile: path,
	clarificationsMatchAll: Boolean,
	color: Boolean,
	csv: Boolean,
	csvComponentPrefix: String,
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
	onlyunknown: Boolean,
	out: path,
	plainVertical: Boolean,
	production: Boolean,
	relativeLicensePath: Boolean,
	relativeModulePath: Boolean,
	start: String,
	summary: Boolean,
	unknown: Boolean,
	version: Boolean,
};
// For the format requirements of "shortHands", see the documentation for nopt: https://www.npmjs.com/package/nopt
export const shortHands = {
	h: ['--help'],
	v: ['--version'],
};

/**
 * @typedef {Object} ParsedArguments Parsed command-line arguments from nopt.
 * @property {boolean=} angularCli Output in Angular CLI-compatible plain vertical format.
 * @property {string=} clarificationsFile Path to a license clarifications file.
 * @property {boolean=} clarificationsMatchAll Require every clarification to match a package.
 * @property {(boolean | null)=} color Colorize output.
 * @property {boolean=} csv Output in CSV format.
 * @property {string=} csvComponentPrefix Prefix column for component in CSV format.
 * @property {string=} customPath Path to a JSON file that defines a custom output format.
 * @property {(string | number)=} depth Recurse dependencies up to a specific depth.
 * @property {boolean=} development Only show development dependencies.
 * @property {(string | boolean | number | null)=} direct Look for direct dependencies only.
 * @property {string=} excludeLicenses Exclude modules which licenses are in the comma-separated list from the output.
 * @property {string=} excludePackages Restrict output to the packages not in the semicolon-separated list.
 * @property {string=} excludePackagesStartingWith Exclude modules starting with a specific string.
 * @property {boolean=} excludePrivatePackages Restrict output to not include any package marked as private.
 * @property {string=} failOn Fail on the first occurrence of a license in the semicolon-separated list.
 * @property {string=} files Path to write output files to.
 * @property {boolean=} help Show help output.
 * @property {string=} includeLicenses Include modules which licenses are in the comma-separated list in the output.
 * @property {string=} includePackages Restrict output to the packages in the semicolon-separated list.
 * @property {boolean=} json Output in JSON format.
 * @property {string=} limitAttributes Restrict formatted JSON output to a specific set of fields.
 * @property {boolean=} markdown Output in Markdown format.
 * @property {boolean=} nopeer Ignore peerDependencies.
 * @property {string=} onlyAllow Fail on the first occurrence of a license not in the semicolon-separated list.
 * @property {boolean=} onlyunknown Only list packages with unknown or guessed licenses.
 * @property {string=} out Write the data to a specific file.
 * @property {boolean=} plainVertical Output in plain vertical format.
 * @property {boolean=} production Only show production dependencies.
 * @property {boolean=} relativeLicensePath Output license file locations as relative paths.
 * @property {boolean=} relativeModulePath Output module locations as relative paths.
 * @property {string=} start Path to start checking dependencies from.
 * @property {boolean=} summary Output a summary of the license usage.
 * @property {boolean=} unknown Report guessed licenses as unknown licenses.
 * @property {boolean=} version Show version output.
 */

function normalizeArgv(args) {
	if (Array.isArray(args) && (args.length === 0 || args[0]?.startsWith('-'))) {
		return [process.execPath, 'license-checker-rseidelsohn', ...args];
	}

	return args;
}

/**
 * Parses command-line arguments.
 *
 * @param {string[]} [args] Command-line arguments to parse.
 * @returns {ParsedArguments} Parsed command-line arguments.
 */
function parseArguments(args) {
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
	const parsedArguments = nopt(knownOptions, shortHands, normalizeArgv(args));

	delete parsedArguments.argv;

	return parsedArguments;
}

/**
 * Converts a value for the "--direct" option into a number.
 *
 * The "--direct" option is meant to accept either a Boolean or a Number. Either of those values will then be taken for
 * determining the depth:
 * - Passing in no value or leaving the parameter off will be interpreted as Infinity
 * - Passing in true will be interpreted as Infinity
 * - Passing in false will be interpreted as 0
 * - Passing in a number will be interpreted as that number
 * - Passing in any other value that can't be recognized as a number will be interpreted as Infinity
 *
 * @param {boolean | number | string | undefined} value
 * @returns number
 */
function toDepthNumber(value = Number.POSITIVE_INFINITY) {
	switch (typeof value) {
		case 'string':
			return depthStringToNumber(value);
		case 'boolean':
			return value ? Number.POSITIVE_INFINITY : 0;
		case 'number':
			return Math.max(0, value);
		default:
			return Number.POSITIVE_INFINITY;
	}
}

function depthStringToNumber(depthString) {
	let numberValue = depthString.toLowerCase();

	if (numberValue === 'true') {
		numberValue = Number.POSITIVE_INFINITY;
	} else if (numberValue === 'false') {
		numberValue = 0;
	} else {
		numberValue = Number(numberValue, 10);

		if (Number.isNaN(numberValue)) {
			numberValue = Number.POSITIVE_INFINITY;
		} else {
			numberValue = Math.max(0, numberValue);
		}
	}

	return numberValue;
}

/**
 * @typedef {ParsedArguments & {
 *   color: boolean,
 *   direct: number,
 *   relativeLicensePath: boolean,
 *   relativeModulePath: boolean,
 *   start: string,
 *   depth: number
 * }} ArgumentsWithDefaults Parsed command-line arguments with defaults applied.
 */

/**
 * Applies default values to parsed command-line arguments.
 *
 * @param {ParsedArguments} parsedArguments Parsed command-line arguments.
 * @returns {ArgumentsWithDefaults} Parsed command-line arguments with defaults applied.
 */
export function setDefaultArguments(parsedArguments = {}) {
	const argumentsWithDefaults = { ...parsedArguments };
	if (argumentsWithDefaults.color === null || argumentsWithDefaults.color === undefined) {
		argumentsWithDefaults.color = supportsColor ? supportsColor.hasBasic : false;
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
}

export function getNormalizedArguments(args) {
	return setDefaultArguments(parseArguments(args));
}
