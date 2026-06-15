import { assert } from 'vitest';

// biome-ignore lint/suspicious/noExplicitAny: JSON not typed correctly yet
export const getPackageKey = (output: any, packageName: string) => {
	const packageKey = Object.keys(output).find(key => key.startsWith(`${packageName}@`));
	assert.ok(packageKey, `Expected ${packageName} in output`);
	return packageKey;
};

// biome-ignore lint/suspicious/noExplicitAny: JSON not typed correctly yet
export const hasPackage = (output: any, packageName: string) =>
	Object.keys(output).some(key => key.startsWith(`${packageName}@`));
