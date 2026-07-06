import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
	getAuthorDetails,
	getRepositoryUrl,
	storeReadmeInPackageJsonIfExists,
} from '../../lib/licenses/package-metadata.js';

const tempDirs: string[] = [];

const createTempDirectory = () => {
	const tempDir = fs.mkdtempSync(path.join(fs.realpathSync(tmpdir()), 'license-checker-metadata-'));
	tempDirs.push(tempDir);
	return tempDir;
};

afterEach(() => {
	for (const tempDir of tempDirs.splice(0)) {
		fs.rmSync(tempDir, { force: true, recursive: true });
	}
});

describe('getRepositoryUrl', () => {
	it('prefers clarification repository values', () => {
		expect(
			getRepositoryUrl({
				clarificationRepository: 'https://example.com/override',
				jsonRepository: { url: 'git+https://github.com/example/package.git' },
			})
		).toBe('https://example.com/override');
	});

	it('normalizes common GitHub repository URL forms', () => {
		expect(
			getRepositoryUrl({
				clarificationRepository: undefined,
				jsonRepository: { url: 'git+https://github.com/example/package.git' },
			})
		).toBe('https://github.com/example/package');
	});
});

describe('getAuthorDetails', () => {
	it('uses clarification values before package author values', () => {
		expect(
			getAuthorDetails({
				clarification: { email: 'clarified@example.com' },
				author: { email: 'author@example.com', name: 'Author', url: 'https://example.com' },
			})
		).toEqual({
			email: 'clarified@example.com',
			publisher: 'Author',
			url: 'https://example.com',
		});
	});
});

describe('storeReadmeInPackageJsonIfExists', () => {
	it('stores README.md contents when no useful readme is already present', () => {
		const tempDir = createTempDirectory();
		const packageJson = { readme: 'No README data found' };
		fs.writeFileSync(path.join(tempDir, 'README.md'), 'Readme text');

		storeReadmeInPackageJsonIfExists(tempDir, packageJson);

		expect(packageJson.readme).toBe('Readme text');
	});

	it('does not overwrite existing useful readme contents', () => {
		const tempDir = createTempDirectory();
		const packageJson = { readme: 'Existing readme' };
		fs.writeFileSync(path.join(tempDir, 'README.md'), 'Readme text');

		storeReadmeInPackageJsonIfExists(tempDir, packageJson);

		expect(packageJson.readme).toBe('Existing readme');
	});
});
