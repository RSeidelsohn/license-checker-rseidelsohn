import { readJson } from '../files/read-json.js';

export function readClarifications(clarificationsFile) {
	const clarifications = {};

	if (!clarificationsFile) {
		return clarifications;
	}

	const clarificationsFromFile = readJson(clarificationsFile);

	for (const [versionString, clarification] of Object.entries(clarificationsFromFile)) {
		const versionSplit = versionString.lastIndexOf('@');
		if (versionSplit !== -1) {
			const name = versionString.slice(0, versionSplit);
			const semverRange = versionString.slice(versionSplit + 1);
			clarifications[name] = clarifications[name] || [];
			// keep track for each clarification if it was used, optionally error when not
			clarifications[name].push({ ...clarification, semverRange, used: false });
		}
	}

	return clarifications;
}

export function assertAllClarificationsWereUsed(clarifications) {
	const unusedClarifications = [];

	for (const [packageName, entries] of Object.entries(clarifications)) {
		for (const clarification of entries) {
			if (!clarification.used) {
				unusedClarifications.push(`${packageName}@${clarification.semverRange}`);
			}
		}
	}

	if (unusedClarifications.length) {
		const list = unusedClarifications.join(', ');
		throw new Error(`Some clarifications (${list}) were unused and --clarificationsMatchAll was specified. Exiting.`);
	}
}
