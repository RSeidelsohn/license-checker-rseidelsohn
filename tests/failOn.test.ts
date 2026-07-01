import { describe, expect, it } from 'vitest';
import { runBin } from './test-helpers';

describe('bin/license-checker-rseidelsohn', () => {
	it('should exit 1 if it finds a single license type (MIT) license due to --failOn MIT', async () => {
		const { code } = await runBin(['--failOn', 'MIT']);

		expect(code).toBe(1);
	});

	it('should exit 1 if it finds forbidden licenses license due to --failOn MIT;ISC', async () => {
		const { code } = await runBin(['--failOn', 'MIT;ISC']);

		expect(code).toBe(1);
	});

	it('should give warning about commas if --failOn MIT,ISC is provided', async () => {
		const { stderr } = await runBin(['--failOn', 'MIT,ISC']);

		expect(stderr).toContain('--failOn argument takes semicolons as delimeters instead of commas');
	});
}, /* timeout */ 8000);
