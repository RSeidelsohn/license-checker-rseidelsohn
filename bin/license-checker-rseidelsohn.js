#!/usr/bin/env node
import * as args from '../lib/args.js';
import { exitProcessOrWarnIfNeeded } from '../lib/exitProcessOrWarnIfNeeded.js';
import * as licenseCheckerMain from '../lib/index.js';
import * as helpers from '../lib/licenseCheckerHelpers.js';

const parsedArgs = args.getNormalizedArguments();
const hasFailingArg = parsedArgs.failOn || parsedArgs.onlyAllow;
const kownOptions = Object.keys(args.knownOptions);
const unknownArgs = Object.keys(parsedArgs).filter(arg => !kownOptions.includes(arg));

exitProcessOrWarnIfNeeded({ unknownArgs, parsedArgs, hasFailingArg });

licenseCheckerMain.init(parsedArgs, (err, foundLicensesJson) => {
	if (err) {
		console.error(err.message || err);
		process.exitCode = 1;
		return;
	}

	if (!parsedArgs.out) {
		if (helpers.shouldColorizeOutput(parsedArgs)) {
			helpers.colorizeOutput(foundLicensesJson);
		}

		const formattedOutput = helpers.getFormattedOutput(foundLicensesJson, parsedArgs);
		console.log(formattedOutput);
	}
});
