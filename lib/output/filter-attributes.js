export const filterAttributes = (attributes, json) => {
	let filteredJson = json;

	if (attributes) {
		filteredJson = {};
		attributes.forEach(attribute => {
			filteredJson[attribute] = json[attribute];
		});
	}

	return filteredJson;
};
