import spdxCorrect from 'spdx-correct';
import spdxSatisfies from 'spdx-satisfies';

const LICENSE_TITLE_UNKNOWN = 'UNKNOWN';
const bsdLicenses = ['0BSD', 'BSD-2-Clause', 'BSD-3-Clause', 'BSD-4-Clause'];

const transformBSD = spdx => (spdx === 'BSD' ? `(${bsdLicenses.join(' OR ')})` : spdx);
const expandBSD = spdx => (spdx === 'BSD' ? bsdLicenses : [spdx]);
const invertResultOf = fn => spdx => !fn(spdx);
const spdxIsValid = spdx => spdxCorrect(spdx) === spdx;

const parsePolicyList = value => {
	const licenses = [];

	value.split(';').forEach(license => {
		const trimmed = license.trim();
		if (trimmed.length > 0) {
			licenses.push(trimmed);
		}
	});

	return licenses;
};

export function getLicensePolicy(options) {
	if (options.failOn) {
		return {
			failOnLicenses: parsePolicyList(options.failOn),
			onlyAllowLicenses: [],
		};
	}

	if (options.onlyAllow) {
		return {
			failOnLicenses: [],
			onlyAllowLicenses: parsePolicyList(options.onlyAllow),
		};
	}

	return {
		failOnLicenses: [],
		onlyAllowLicenses: [],
	};
}

export function checkForFailOn(currentLicense, failOnLicenses) {
	if (!Array.isArray(failOnLicenses) || failOnLicenses.length === 0) {
		return;
	}

	if (failOnLicenses.includes(currentLicense)) {
		throw new Error(`Found license defined by the --failOn flag: "${currentLicense}". Exiting.`);
	}
}

/**
 * Check if the current license contains (eventually among others) at least one of the allowed licenses.
 */
export function checkForOnlyAllow(currentLicense, packageName, onlyAllowLicenses) {
	if (onlyAllowLicenses.length > 0) {
		let containsOneOfAllowedPackages = false;

		for (const allowedLicense of onlyAllowLicenses) {
			// "currentLicense" is a longer string that may contain several license names,
			// and we check if one of those is a license listed in the "onlyAllowLicenses"
			// licenses array:
			if (currentLicense.includes(allowedLicense)) {
				containsOneOfAllowedPackages = true;
				break;
			}
		}

		if (!containsOneOfAllowedPackages) {
			throw new Error(
				`Package "${packageName}" is licensed under "${currentLicense}" which is not permitted by the --onlyAllow flag. Exiting.`
			);
		}
	}
}

export function throwIfLicensePolicyFails({ currentLicense, failOnLicenses, onlyAllowLicenses, packageName }) {
	if (currentLicense) {
		checkForFailOn(currentLicense, failOnLicenses);
		checkForOnlyAllow(currentLicense, packageName, onlyAllowLicenses);
	}
}

export function getLicenseMatch(licensesArr, compareLicenses) {
	const expandedCompareLicenses = compareLicenses.flatMap(expandBSD);
	const validSPDXLicenses = expandedCompareLicenses.filter(spdxIsValid);
	const invalidSPDXLicenses = expandedCompareLicenses.map(transformBSD).filter(invertResultOf(spdxIsValid));

	let hasUnknownLicense = false;
	let match = false;

	licensesArr.forEach(license => {
		if (license.indexOf(LICENSE_TITLE_UNKNOWN) >= 0) {
			// Necessary due to colorization and preserves the historic include/exclude behavior for unknown licenses.
			hasUnknownLicense = true;
		} else {
			const withoutTrailingAsterisk = license.endsWith('*') ? license.slice(0, -1) : license;
			const transformed = transformBSD(withoutTrailingAsterisk);

			if (
				invalidSPDXLicenses.indexOf(transformed) >= 0 ||
				(spdxCorrect(transformed) &&
					validSPDXLicenses.length > 0 &&
					spdxSatisfies(spdxCorrect(transformed), validSPDXLicenses))
			) {
				match = true;
			}
		}
	});

	return { hasUnknownLicense, match };
}
