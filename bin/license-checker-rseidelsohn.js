#!/usr/bin/env node

import { getNormalizedArguments, knownOptions } from '../lib/args.js';
import { exitProcessOrWarnIfNeeded } from '../lib/exitProcessOrWarnIfNeeded.js';
import { runLicenseCheck } from '../lib/index.js';
import { colorizeOutput, getFormattedOutput, shouldColorizeOutput } from '../lib/licenseCheckerHelpers.js';

const parsedArgs = getNormalizedArguments();
const hasFailingArg = parsedArgs.failOn || parsedArgs.onlyAllow;
const known = Object.keys(knownOptions);
const unknownArgs = Object.keys(parsedArgs).filter(arg => !known.includes(arg));

exitProcessOrWarnIfNeeded({ unknownArgs, parsedArgs, hasFailingArg });

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
