import { describe, expect, it } from 'vitest';
import { asCSV } from '../../lib/output/csv.js';
import { getPackageKey } from '../test-helpers';
import { normalOutput, withCustomFormat } from './renderers.testdata';

const customFormat = {
	name: '<<Default Name>>',
	description: '<<Default Description>>',
	pewpew: '<<Should Never be set>>',
};

describe('asCSV', () => {
	it('with normal output', () => {
		const [heading, data] = asCSV(normalOutput).split('\n');
		const codeFramePackageKey = getPackageKey(normalOutput, '@babel/code-frame');

		expect(heading).toBe('"module name","license","repository"');
		expect(data).toBe(`"${codeFramePackageKey}","MIT","https://github.com/babel/babel"`);
	});

	it('with custom format', () => {
		const [heading, data] = asCSV(withCustomFormat, customFormat).split('\n');
		const codeFramePackageKey = getPackageKey(withCustomFormat, '@babel/code-frame');
		expect(heading).toBe('"module name","name","description","pewpew"');
		expect(data).toBe(
			`"${codeFramePackageKey}","@babel/code-frame","Generate errors that contain a code frame that point to source locations.","<<Should Never be set>>"`
		);
	});

	it('with custom format and component prefix', () => {
		const [heading, data] = asCSV(withCustomFormat, customFormat, 'main-module').split('\n');
		const codeFramePackageKey = getPackageKey(withCustomFormat, '@babel/code-frame');
		expect(heading).toBe('"component","module name","name","description","pewpew"');
		expect(data).toBe(
			`"main-module","${codeFramePackageKey}","@babel/code-frame","Generate errors that contain a code frame that point to source locations.","<<Should Never be set>>"`
		);
	});

	it('with simple data', () => {
		const data = asCSV({ foo: { licenses: 'MIT', repository: '/path/to/foo' } });
		expect(data).toContain('"foo","MIT","/path/to/foo"');
	});

	it('with partial data', () => {
		const data = asCSV({ foo: {} });
		expect(data).toContain('"foo","",""');
	});
});
