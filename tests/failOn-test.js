import { spawn } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

describe('bin/license-checker-rseidelsohn', () => {
	it('should exit 1 if it finds a single license type (MIT) license due to --failOn MIT', done => {
		spawn('node', [path.join(__dirname, '../bin/license-checker-rseidelsohn'), '--failOn', 'MIT'], {
			cwd: path.join(__dirname, '../'),
			stdio: 'ignore',
		}).on('exit', code => {
			expect(code).toBe(1);
			done();
		});
	});

	it('should exit 1 if it finds forbidden licenses license due to --failOn MIT;ISC', done => {
		spawn('node', [path.join(__dirname, '../bin/license-checker-rseidelsohn'), '--failOn', 'MIT;ISC'], {
			cwd: path.join(__dirname, '../'),
			stdio: 'ignore',
		}).on('exit', code => {
			expect(code).toBe(1);
			done();
		});
	});

	it('should give warning about commas if --failOn MIT,ISC is provided', done => {
		var proc = spawn('node', [path.join(__dirname, '../bin/license-checker-rseidelsohn'), '--failOn', 'MIT,ISC'], {
			cwd: path.join(__dirname, '../'),
			stdio: 'pipe',
		});
		var stderr = '';
		proc.stdout.on('data', () => {});
		proc.stderr.on('data', data => {
			stderr += data.toString();
		});
		proc.on('close', () => {
			expect(stderr).toContain('--failOn argument takes semicolons as delimeters instead of commas');
			done();
		});
	});
}, /* timeout */ 8000);
