import { describe, expect, it } from 'vitest';
import { colorizeOutput, getFormattedOutput, shouldColorizeOutput } from '../../lib/output/format-output.js';

describe('shouldColorizeOutput', () => {
	it('allows color only for terminal tree output', () => {
		expect(shouldColorizeOutput({ color: true })).toBe(true);
		expect(shouldColorizeOutput({ color: true, json: true })).toBe(false);
		expect(shouldColorizeOutput({ color: true, out: 'licenses.json' })).toBe(false);
	});
});

describe('colorizeOutput', () => {
	it('replaces package keys with colorized package keys', () => {
		const output = { 'foo@1.0.0': { licenses: 'MIT' } };

		colorizeOutput(output);

		expect(Object.keys(output)).toHaveLength(1);
		expect(Object.values(output)[0]).toEqual({ licenses: 'MIT' });
	});
});

describe('getFormattedOutput', () => {
	it('returns limited JSON output when limitAttributes is set', () => {
		const formatted = getFormattedOutput(
			{ 'foo@1.0.0': { licenses: 'MIT', repository: 'https://example.com' } },
			{ json: true, limitAttributes: 'licenses' }
		);

		expect(JSON.parse(formatted)).toEqual({ 'foo@1.0.0': { licenses: 'MIT' } });
	});
});
