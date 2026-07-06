import fs from 'node:fs';
import path from 'node:path';
import { firstDefined } from '../shared/first-defined.js';

export function getRepositoryUrl({ clarificationRepository, jsonRepository }) {
	if (clarificationRepository) {
		return clarificationRepository;
	}

	if (typeof jsonRepository?.url === 'string') {
		return jsonRepository.url
			.replace('git+ssh://git@', 'git://')
			.replace('git+https://github.com', 'https://github.com')
			.replace('git://github.com', 'https://github.com')
			.replace('git@github.com:', 'https://github.com/')
			.replace(/\.git$/, '');
	}
}

export function getAuthorDetails({ clarification, author }) {
	const publisher = firstDefined(clarification?.publisher, author?.name);
	const email = firstDefined(clarification?.email, author?.email);
	const url = firstDefined(clarification?.url, author?.url);

	return { publisher, email, url };
}

// Eventually store the contents of the module's README.md in currentExtendedPackageJson.readme:
export const storeReadmeInPackageJsonIfExists = (modulePath, currentExtendedPackageJson) => {
	if (
		typeof modulePath !== 'string' ||
		typeof currentExtendedPackageJson !== 'object' ||
		modulePath === '' ||
		(typeof currentExtendedPackageJson?.readme === 'string' &&
			currentExtendedPackageJson?.readme?.toLowerCase()?.indexOf('no readme data found') === -1)
	) {
		return;
	}

	const readmeFile = path.join(modulePath, 'README.md');

	if (fs.existsSync(readmeFile)) {
		currentExtendedPackageJson.readme = fs.readFileSync(readmeFile, 'utf8').toString();
	}
};
