import { expect } from 'vitest';

// biome-ignore lint/suspicious/noExplicitAny: JSON not typed correctly yet
export const getPackageKey = (output: any, packageName: string) => {
	const packageKey = Object.keys(output).find(key => key.startsWith(`${packageName}@`));
	expect(packageKey, `Expected ${packageName} in output`).toBeTruthy();
	return packageKey;
};

// biome-ignore lint/suspicious/noExplicitAny: JSON not typed correctly yet
export const hasPackage = (output: any, packageName: string) =>
	Object.keys(output).some(key => key.startsWith(`${packageName}@`));
