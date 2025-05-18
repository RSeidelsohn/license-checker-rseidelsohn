import { usageMessage } from './usageMessage.js';

const version = '4.4.2';

const exitProcessOrWarnIfNeeded = ({ unknownArgs, parsedArgs }) => {
	if (unknownArgs.length) {
		console.error(`license-checker-rseidelsohn@${version}`, '\n');
		console.error(
			`Error: Unknown option${unknownArgs.length > 1 ? 's' : ''}: ${unknownArgs
				.map((unknownArg) => `'${unknownArg}'`)
				.join(', ')}`,
		);
		console.error(`       Possibly a typo?`, '\n');
		console.error(usageMessage, '\n');

		process.exit(1);
	}

	if (parsedArgs.help) {
		console.log(`license-checker-rseidelsohn@${version}`);
		console.log(usageMessage, '\n');

		process.exit(0);
	}

	if (parsedArgs.version) {
		console.error(version);

		process.exit(1);
	}

	if (parsedArgs.failOn && parsedArgs.onlyAllow) {
		console.error('Error: --failOn and --onlyAllow can not be used at the same time. Choose one or the other.');

		process.exit(1);
	}

	const hasFailArgs = parsedArgs.failOn ?? parsedArgs.onlyAllow;

	if (hasFailArgs && hasFailArgs.indexOf(',') >= 0) {
		const argName = parsedArgs.failOn ? 'failOn' : 'onlyAllow';
		console.warn(
			`Warning: The --${argName} argument takes semicolons as delimeters instead of commas (some license names can contain commas)`,
		);
	}
};

export { exitProcessOrWarnIfNeeded };
