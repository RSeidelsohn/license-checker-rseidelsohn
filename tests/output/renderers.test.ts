import { describe, expect, it } from 'vitest';
import { asMarkDown, asPlainVertical, asSummary, asTree } from '../../lib/output/renderers.js';
import { getPackageKey } from '../test-helpers';
import { normalOutput, withBsd, withCustomFormat } from './renderers.testdata';

const customFormat = {
	name: '<<Default Name>>',
	description: '<<Default Description>>',
	pewpew: '<<Should Never be set>>',
};

describe('asMarkDown', () => {
	it('with normal output', () => {
		const [firstRow] = asMarkDown(normalOutput).split('\n');
		const codeFramePackageKey = getPackageKey(normalOutput, '@babel/code-frame');
		expect(firstRow).toBe(`- [${codeFramePackageKey}](https://github.com/babel/babel) - MIT`);
	});

	it('with custom format', () => {
		const [firstRow] = asMarkDown(withCustomFormat, customFormat).split('\n');
		const codeFramePackageKey = getPackageKey(withCustomFormat, '@babel/code-frame');
		expect(firstRow).toBe(`- **[${codeFramePackageKey}](https://github.com/babel/babel)**`);
	});

	it('with simple data', () => {
		const data = asMarkDown({ foo: { licenses: 'MIT', repository: '/path/to/foo' } });
		expect(data).toContain('[foo](/path/to/foo) - MIT');
	});
});

describe('asSummary', () => {
	it('with simple data', () => {
		const data = asSummary({ foo: { licenses: 'MIT', repository: '/path/to/foo' } });
		expect(data).toContain('└─');
	});
});

describe('asPlainVertical', () => {
	it('with BSD output', () => {
		const data = asPlainVertical(withBsd);
		expect(data).toContain('bsd-3-module 0.0.0\nBSD-3-Clause');
	});
});

describe('asTree', () => {
	it('with minimal data', () => {
		const data = asTree([{}]);
		expect(data).toContain('└─');
	});
});
