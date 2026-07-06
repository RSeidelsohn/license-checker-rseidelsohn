export function getCopyrightLines(fileContents = '') {
	return fileContents
		.replace(/\r\n/g, '\n')
		.split('\n\n')
		.filter(function selectCopyRightStatements(value) {
			return (
				value.startsWith('opyright', 1) && // include copyright statements
				!value.startsWith('opyright notice', 1) && // exclude lines from from license text
				!value.startsWith('opyright and related rights', 1)
			);
		})
		.filter(function removeDuplicates(value, index, list) {
			return index === 0 || value !== list[0];
		});
}
