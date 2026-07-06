import { describe, expect, it } from 'vitest';
import { deleteNonDirectDependencies } from '../../lib/dependencies/direct-dependencies.js';

describe('deleteNonDirectDependencies', () => {
	it('keeps only direct dependencies by default', () => {
		const tree = {
			_dependencies: { direct: '1.0.0' },
			dependencies: { direct: {}, transitive: {} },
			devDependencies: {},
		};

		deleteNonDirectDependencies(tree, {});

		expect(Object.keys(tree.dependencies)).toEqual(['direct']);
	});

	it('keeps production direct dependencies when production mode is active', () => {
		const tree = {
			_dependencies: { dev: '1.0.0', prod: '1.0.0' },
			dependencies: { dev: {}, prod: {} },
			devDependencies: { dev: '1.0.0' },
		};

		deleteNonDirectDependencies(tree, { production: true });

		expect(Object.keys(tree.dependencies)).toEqual(['prod']);
	});

	it('keeps dev dependencies when development mode is active', () => {
		const tree = {
			_dependencies: { dev: '1.0.0', prod: '1.0.0' },
			dependencies: { dev: {}, prod: {} },
			devDependencies: { dev: '1.0.0' },
		};

		deleteNonDirectDependencies(tree, { development: true });

		expect(Object.keys(tree.dependencies)).toEqual(['dev']);
	});
});
