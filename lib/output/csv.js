export const getCsvData = (sorted, customFormat, csvComponentPrefix) => {
	const csvDataArr = [];

	Object.entries(sorted).forEach(([key, module]) => {
		const dataElements = [];

		if (csvComponentPrefix) {
			dataElements.push(`"${csvComponentPrefix}"`);
		}

		// Grab the custom keys from the custom format
		if (typeof customFormat === 'object' && Object.keys(customFormat).length > 0) {
			dataElements.push(`"${key}"`);

			Object.keys(customFormat).forEach(item => {
				dataElements.push(`"${module[item]}"`);
			});
		} else {
			// Be sure to push empty strings for empty values, as this is what CSV expects:
			dataElements.push([`"${key}"`, `"${module.licenses || ''}"`, `"${module.repository || ''}"`]);
		}

		csvDataArr.push(dataElements.join(','));
	});

	return csvDataArr;
};

export const getCsvHeaders = (customFormat, csvComponentPrefix) => {
	const prefixName = '"component"';
	const entriesArr = [];

	if (csvComponentPrefix) {
		entriesArr.push(prefixName);
	}

	if (typeof customFormat === 'object' && Object.keys(customFormat).length > 0) {
		entriesArr.push('"module name"');

		Object.keys(customFormat).forEach(item => {
			entriesArr.push(`"${item}"`);
		});
	} else {
		entriesArr.push('"module name"', '"license"', '"repository"');
	}

	return entriesArr.join(',');
};

export const asCSV = (sorted, customFormat, csvComponentPrefix) => {
	const csvHeaders = getCsvHeaders(customFormat, csvComponentPrefix);
	const csvDataArr = getCsvData(sorted, customFormat, csvComponentPrefix);

	return [csvHeaders, ...csvDataArr].join('\n');
};
