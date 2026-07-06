/**
 * @typedef {Record<string, unknown> & {
 *   dependencies?: Record<string, DependencyTreeNode>,
 *   name?: string,
 *   version?: string
 * }} DependencyTreeNode
 */

/**
 * Walks a dependency tree depth-first and calls `visit` for every accepted node.
 *
 * A maxDepth of 0 still visits direct dependencies, matching the license checker's historic `direct: 0` behavior.
 *
 * @param {DependencyTreeNode} rootDependency
 * @param {{
 *   maxDepth?: number | boolean | string | null,
 *   shouldVisit?: (dependency: DependencyTreeNode, currentDepth: number) => boolean,
 *   visit: (dependency: DependencyTreeNode, currentDepth: number) => void | boolean
 * }} options
 * @returns {void}
 */
export function walkDependencyTree(
	rootDependency,
	{ maxDepth = Number.POSITIVE_INFINITY, shouldVisit = () => true, visit }
) {
	if (typeof visit !== 'function') {
		throw new TypeError('walkDependencyTree requires a visit function');
	}

	const walk = (dependency, currentDepth) => {
		if (!dependency || !shouldVisit(dependency, currentDepth)) {
			return;
		}

		const visitResult = visit(dependency, currentDepth);

		if (visitResult === false || currentDepth > maxDepth || !dependency.dependencies) {
			return;
		}

		Object.keys(dependency.dependencies).forEach(dependencyName => {
			walk(dependency.dependencies[dependencyName], currentDepth + 1);
		});
	};

	walk(rootDependency, 0);
}
