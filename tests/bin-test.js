import assert from 'node:assert';
import { spawn } from 'node:child_process';
import path from 'node:path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

describe('bin/license-checker-rseidelsohn', () => {
	it('should exit 0', done => {
		spawn('node', [path.join(__dirname, '../bin/license-checker-rseidelsohn')], {
			cwd: path.join(__dirname, '../'),
			stdio: 'ignore',
		}).on('exit', code => {
			assert.equal(code, 0);
			done();
		});
	});
}, /* timeout */ 8000);
