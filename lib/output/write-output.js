import fs from 'node:fs';
import path from 'node:path';

export async function writeOutputToFile(outputFile, formattedOutput) {
	const dir = path.dirname(outputFile);
	await fs.promises.mkdir(dir, { recursive: true });
	await fs.promises.writeFile(outputFile, formattedOutput, 'utf-8');
}

export async function writeIndividualLicenseFilesToDir(outDir, resultJson) {
	await fs.promises.mkdir(outDir, { recursive: true });
	for (const key of Object.keys(resultJson)) {
		const { licenseFile, licenseText } = resultJson[key];
		const outPath = path.join(outDir, `${key}-LICENSE.txt`);
		// key contains versioned packages, potentially scoped, e.g. @foo/bar@1.2.3
		const effectiveOutDir = path.dirname(outPath);

		if (licenseFile && fs.existsSync(licenseFile)) {
			await fs.promises.mkdir(effectiveOutDir, { recursive: true });
			await fs.promises.copyFile(licenseFile, outPath);
		} else if (typeof licenseText === 'string') {
			await fs.promises.mkdir(effectiveOutDir, { recursive: true });
			await fs.promises.writeFile(outPath, licenseText, 'utf8');
		} else {
			console.warn(`No license file found for module '${key}'`);
		}
	}
}
