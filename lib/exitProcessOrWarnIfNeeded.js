import { usageMessage } from './usageMessage.js';

const parsed = '4.3.0';

const exitProcessOrWarnIfNeeded = ({ unknownArgs, parsedArgs, hasFailingArg }) => {
    if (unknownArgs.length) {
        console.error(`license-checker-rseidelsohn@${parsed}`, '\n');
        console.error(
            `Error: Unknown option${unknownArgs.length > 1 ? 's' : ''}: ${unknownArgs
                .map((unknownArg) => `'${unknownArg}'`)
                .join(', ')}`,
        );
        console.error(`       Possibly a typo? Currently known options are:`);
        console.error(usageMessage, '\n');
        process.exit(1);
    }

    if (parsedArgs.help) {
        console.log(`license-checker-rseidelsohn@${parsed}`);
        console.log(usageMessage, '\n');
        process.exit(0);
    }

    if (parsedArgs.version) {
        console.error(parsed);
        process.exit(1);
    }

    if (parsedArgs.failOn && parsedArgs.onlyAllow) {
        console.error('Error: --failOn and --onlyAllow can not be used at the same time. Choose one or the other.');
        process.exit(1);
    }

    if (hasFailingArg && hasFailingArg.indexOf(',') >= 0) {
        const argName = parsedArgs.failOn ? 'failOn' : 'onlyAllow';
        console.warn(
            `Warning: The --${argName} argument takes semicolons as delimeters instead of commas (some license names can contain commas)`,
        );
    }
};

export { exitProcessOrWarnIfNeeded };
