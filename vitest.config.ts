import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['tests/test.js', 'tests/**/*-test.js', 'tests/**/*.test.ts'],
		restoreMocks: true,
	},
});
