export function firstDefined(...values) {
	for (const value of values) {
		if (typeof value !== 'undefined') {
			return value;
		}
	}
}
