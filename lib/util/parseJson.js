import fs from 'node:fs';

export const parseJson = jsonPath => {
	if (typeof jsonPath !== 'string') {
		return new Error('The path was not specified for the JSON file to parse.');
	}

	try {
		const jsonFileContents = fs.readFileSync(jsonPath, { encoding: 'utf8' });

		return JSON.parse(jsonFileContents);
	} catch (err) {
		return err;
	}
};
