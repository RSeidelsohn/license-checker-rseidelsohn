import fs from 'node:fs';
import path from 'node:path';
import { supportsColor } from 'chalk';
import { describe, expect, it } from 'vitest';
import { getNormalizedArguments, knownOptions, setDefaultArguments, shortHands } from '../../lib/cli/options.js';
import { usageMessage } from '../../lib/cli/usage.js';

type ArgumentFormat = 'json' | 'markdown' | 'csv' | 'summary';

const repoPath = path.resolve(import.meta.dirname, '../..');

const getKnownCliOptions = () => Object.keys(knownOptions);

const getReadmeCliOptions = () => {
	const readme = fs.readFileSync(path.join(repoPath, 'README.md'), 'utf8');

	return Array.from(readme.matchAll(/^- `--([A-Za-z][A-Za-z0-9]*)/gm), match => match[1]);
};

const getUsageOptions = () => Array.from(usageMessage.matchAll(/^\s+--([A-Za-z][A-Za-z0-9]*)/gm), match => match[1]);

const getUnknownLongOptionMentions = (text: string) => {
	const known = new Set(getKnownCliOptions());
	return Array.from(new Set(Array.from(text.matchAll(/--([A-Za-z][A-Za-z0-9]*)/g), match => match[1]))).filter(
		option => !known.has(option)
	);
};

describe('getNormalizedArguments', () => {
	it('parses process.argv-style argument arrays', () => {
		const result = getNormalizedArguments(['node', 'cli', '--unknown', '--onlyunknown', '--color']);

		expect(result.unknown).toBe(true);
		expect(result.onlyunknown).toBe(true);
		expect(result.color).toBe(true);
	});

	it('parses sliced argument arrays', () => {
		const result = getNormalizedArguments(['--unknown', '--onlyunknown', '--color']);

		expect(result.unknown).toBe(true);
		expect(result.onlyunknown).toBe(true);
		expect(result.color).toBe(true);
	});

	it('parses shorthand argument arrays', () => {
		expect(getNormalizedArguments(['-h']).help).toBe(true);
		expect(getNormalizedArguments(['-v']).version).toBe(true);
	});
});

describe('CLI option documentation', () => {
	it('keeps README CLI options in sync with known CLI options', () => {
		expect(getReadmeCliOptions()).toEqual(getKnownCliOptions());
	});

	it('keeps usage output options in sync with known CLI options', () => {
		expect(getUsageOptions()).toEqual(getKnownCliOptions());
	});

	it('documents CLI option shorthands in README and usage output', () => {
		const readme = fs.readFileSync(path.join(repoPath, 'README.md'), 'utf8');

		Object.entries(shortHands).forEach(([shortOption, [longOption]]) => {
			expect(readme).toContain(`\`${longOption}\` (\`-${shortOption}\`)`);
			expect(usageMessage).toContain(`${longOption} (-${shortOption})`);
		});
	});

	it('does not mention unknown long options in README or usage output', () => {
		const readme = fs.readFileSync(path.join(repoPath, 'README.md'), 'utf8');

		expect(getUnknownLongOptionMentions(readme)).toEqual([]);
		expect(getUnknownLongOptionMentions(usageMessage)).toEqual([]);
	});
});

describe('setDefaultArguments', () => {
	it('should handle undefined', () => {
		const result = setDefaultArguments(undefined);
		expect(result.color).toBe(supportsColor ? supportsColor.hasBasic : false);
		expect(result.start).toBe(repoPath);
	});

	it('should handle color undefined', () => {
		const result = setDefaultArguments({
			color: undefined,
			start: repoPath,
		});
		expect(result.color).toBe(supportsColor ? supportsColor.hasBasic : false);
		expect(result.start).toBe(repoPath);
	});

	it('should handle direct undefined', () => {
		const result = setDefaultArguments({
			direct: undefined,
			start: repoPath,
		});
		expect(result.direct).toBe(Number.POSITIVE_INFINITY);
		expect(result.start).toBe(repoPath);
	});

	it('should handle direct true', () => {
		const result = setDefaultArguments({ direct: true, start: repoPath });
		expect(result.direct).toBe(Number.POSITIVE_INFINITY);
		expect(result.start).toBe(repoPath);
	});

	it('should override direct option with depth option', () => {
		const result = setDefaultArguments({
			direct: '9',
			depth: '99',
			start: repoPath,
		});
		expect(result.direct).toBe(99);
		expect(result.start).toBe(repoPath);
	});

	it('should use depth for direct option when direct is not provided', () => {
		const result = setDefaultArguments({ depth: '99', start: repoPath });
		expect(result.direct).toBe(99);
		expect(result.start).toBe(repoPath);
	});

	it('should normalize depth 0 to direct depth 0', () => {
		const result = setDefaultArguments({ depth: '0', start: repoPath });
		expect(result.direct).toBe(0);
	});

	(['json', 'markdown', 'csv', 'summary'] as const).forEach((type: ArgumentFormat) => {
		it(`should disable color on ${type}`, () => {
			const def: { color: undefined; start: string } & Partial<Record<ArgumentFormat, boolean>> = {
				color: undefined,
				start: repoPath,
			};
			def[type] = true;
			const result = setDefaultArguments(def);
			expect(result.color).toBe(false);
			expect(result.start).toBe(repoPath);
		});
	});
});
