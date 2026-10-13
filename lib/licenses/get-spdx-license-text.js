import { createRequire } from 'node:module';
import spdxExpressionParse from 'spdx-expression-parse';

const require = createRequire(import.meta.url);

/**
 * Return the canonical SPDX license text for a simple license identifier.
 * Compound expressions and licenses with exceptions are intentionally skipped,
 * because they cannot be represented by one unambiguous license text.
 *
 * @param {unknown} licenseExpression
 * @returns {string | undefined}
 */
export const getSpdxLicenseText = licenseExpression => {
	if (typeof licenseExpression !== 'string') {
		return;
	}

	try {
		const parsedExpression = spdxExpressionParse(licenseExpression);

		if (!parsedExpression.license || parsedExpression.plus || parsedExpression.exception) {
			return;
		}

		const license = require(`spdx-license-list/licenses/${parsedExpression.license}`);
		if (typeof license.licenseText === 'string') {
			return license.licenseText;
		}
	} catch {
		return;
	}
};
