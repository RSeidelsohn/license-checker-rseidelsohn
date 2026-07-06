#!/usr/bin/env node

import { getNormalizedArguments, knownOptions } from './cli/options.js';
import { exitProcessOrWarnIfNeeded } from './cli/preflight.js';
import { runLicenseCheck } from './index.js';
import { colorizeOutput, getFormattedOutput, shouldColorizeOutput } from './output/format-output.js';

const parsedArgs = getNormalizedArguments();
const known = Object.keys(knownOptions);
const unknownArgs = Object.keys(parsedArgs).filter(arg => !known.includes(arg));

exitProcessOrWarnIfNeeded({ unknownArgs, parsedArgs });

try {
	const foundLicensesJson = await runLicenseCheck(parsedArgs);
	if (!parsedArgs.out) {
		if (shouldColorizeOutput(parsedArgs)) {
			colorizeOutput(foundLicensesJson);
		}

		const formattedOutput = getFormattedOutput(foundLicensesJson, parsedArgs);
		console.log(formattedOutput);
	}
} catch (error) {
	console.error(error.message ?? error);
	process.exitCode = 1;
}
