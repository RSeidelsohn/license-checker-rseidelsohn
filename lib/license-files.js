const path = require('path');

const BASENAMES_PRECEDENCE = [
    /^LICENSE$/,
    /^LICENSE\-\w+$/, // e.g. LICENSE-MIT
    /^LICENCE$/,
    /^LICENCE\-\w+$/, // e.g. LICENCE-MIT
    /^MIT-LICENSE$/,
    /^COPYING$/,
    /^README$/,
];

// Find and list license files in the precedence order
module.exports = function(dirFiles) {
    const files = [];

    BASENAMES_PRECEDENCE.forEach((basenamePattern) => {
        let found = false;

        dirFiles.forEach((filename) => {
            if (!found) {
                const basename = path.basename(filename, path.extname(filename)).toUpperCase();

                if (basenamePattern.test(basename)) {
                    files.push(filename);
                    found = true;
                }
            }
        });
    });

    return files;
};
