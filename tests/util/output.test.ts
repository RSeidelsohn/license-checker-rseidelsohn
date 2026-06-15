import { readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { rimraf } from 'rimraf';
import { describe, expect, it, vi } from 'vitest';
import { asCSV, asFiles, asMarkDown, asPlainVertical, asSummary, asTree, print } from '../../lib/util/output.js';
import { getPackageKey } from '../test-helpers.ts';
import { normalOutput, withBsd, withCustomFormat } from './output.testdata.ts';

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

describe('print', () => {
	it('should not return anything but print a tree to to console.log', () => {
		let logOutput = '';
		vi.spyOn(console, 'log').mockImplementation(arg => {
			logOutput += arg;
		});
		print([{}]);
		expect(logOutput).toContain('└─');
	});
});

describe('asTree', () => {
	it('with minimal data', () => {
		const data = asTree([{}]);
		expect(data).toContain('└─');
	});
});

describe('asFiles', () => {
	it('should write the license file and warn about missing ones', async () => {
		let warnOutput = '';
		vi.spyOn(console, 'warn').mockImplementation(arg => {
			warnOutput += arg;
		});

		const out = path.join(tmpdir(), 'lc');
		asFiles(
			{
				foo: { licenses: 'MIT', repository: '/path/to/foo', licenseFile: path.join(__dirname, '../../LICENSE') },
				bar: { licenses: 'MIT' },
			},
			out
		);
		const [licenseFile] = await readdir(out);
		expect(licenseFile).toBe('foo-LICENSE.txt');
		expect(warnOutput).toContain("No license file found for module 'bar'");
		await rimraf(out);
	});
});
