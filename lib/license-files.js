import path from 'node:path';

const BASENAMES_PRECEDENCE = [
    /^LICENSE$/,
    /^LICENSE\-\w+$/, // e.g. LICENSE-MIT
    /^LICENCE$/,
    /^LICENCE\-\w+$/, // e.g. LICENCE-MIT
    /^MIT-LICENSE$/,
    /^COPYING$/,
    /^README$/, // TODO: should we really include README?
];

// Find and list license files in the precedence order
const licenseFiles = (dirFiles) => {
    const files = [];

    BASENAMES_PRECEDENCE.forEach((basenamePattern) => {
        dirFiles.some((filename) => {
            const basename = path.basename(filename, path.extname(filename)).toUpperCase();

            if (basenamePattern.test(basename)) {
                files.push(filename);
                return true;
            }

            return false;
        });
    });

    return files;
};
export { licenseFiles };
