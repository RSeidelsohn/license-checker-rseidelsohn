import { describe, expect, it } from 'vitest';
import { walkDependencyTree } from '../../lib/dependencies/walk-dependency-tree.js';

describe('walkDependencyTree', () => {
	it('visits root and direct dependencies when maxDepth is 0', () => {
		const visited: string[] = [];
		const tree = {
			name: 'root',
			dependencies: {
				direct: {
					name: 'direct',
					dependencies: {
						transitive: { name: 'transitive' },
					},
				},
			},
		};

		walkDependencyTree(tree, {
			maxDepth: 0,
			visit: (dependency, depth) => {
				visited.push(`${dependency.name}:${depth}`);
			},
		});

		expect(visited).toEqual(['root:0', 'direct:1']);
	});

	it('lets the visitor stop a subtree', () => {
		const visited: string[] = [];
		const tree = {
			name: 'root',
			dependencies: {
				direct: {
					name: 'direct',
					dependencies: {
						transitive: { name: 'transitive' },
					},
				},
			},
		};

		walkDependencyTree(tree, {
			visit: dependency => {
				visited.push(String(dependency.name));
				return dependency.name !== 'direct';
			},
		});

		expect(visited).toEqual(['root', 'direct']);
	});

	it('uses shouldVisit to skip already seen dependencies', () => {
		const sharedDependency = { name: 'shared' };
		const visited = new Set<string>();
		const tree = {
			name: 'root',
			dependencies: {
				first: sharedDependency,
				second: sharedDependency,
			},
		};

		walkDependencyTree(tree, {
			shouldVisit: dependency => !visited.has(String(dependency.name)),
			visit: dependency => {
				visited.add(String(dependency.name));
			},
		});

		expect(Array.from(visited)).toEqual(['root', 'shared']);
	});

	it('requires a visit function', () => {
		expect(() => {
			// @ts-expect-error verifies the runtime guard for missing visitors
			walkDependencyTree({}, {});
		}).toThrow(/walkDependencyTree requires a visit function/);
	});
});
