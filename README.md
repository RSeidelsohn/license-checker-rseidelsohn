<img src="https://img.shields.io/npm/l/license-checker-rseidelsohn" />

[![NPM](https://nodei.co/npm/license-checker-rseidelsohn.png)](https://nodei.co/npm/license-checker-rseidelsohn/)

# NPM License Checker

## Table of Contents

-   [NPM License Checker](#npm-license-checker)
    -   [A message from the maintainer](#a-message-from-the-maintainer)
    -   [Table of Contents](#table-of-contents)
    -   [Introduction](#introduction)
    -   [Changes](#changes)
        -   [Version 4.4.1](#Version-4-4-1)
        -   [Version 4.4.0](#Version-4-4-0)
        -   [Version 4.3.1](#Version-4-3-1)
        -   [Version 4.3.0](#Version-4-3-0)
        -   [Version 4.2.11](#Version-4-2-11)
        -   [Version 4.2.10](#Version-4-2-10)
        -   [Version 4.2.9](#Version-4-2-9)
        -   [Version 4.2.8](#Version-4-2-8)
        -   [Version 4.2.7](#Version-4-2-7)
        -   [Version 4.2.6](#Version-4-2-6)
        -   [Version 4.2.5](#Version-4-2-5)
        -   [Version 4.2.4](#Version-4-2-4)
        -   [Version 4.2.3](#Version-4-2-3)
        -   [Version 4.2.2](#Version-4-2-2)
        -   [Version 4.2.1](#Version-4-2-1)
        -   [Version 4.2.0](#Version-4-2-0)
        -   [Version 4.1.1](#Version-4-1-1)
        -   [Version 4.1.0](#Version-4-1-0)
        -   [Version 4.0.1](#Version-4-0-1)
        -   [Version 4.0.0](#Version-4-0-0)
        -   [Version 3.3.0](#Version-3-3-0)
        -   [Version 3.2.1](#Version-3-2-1)
        -   [Version 3.2.0](#Version-3-2-0)
        -   [Version 3.1.0](#Version-3-1-0)
        -   [Version 3.0.1](#Version-3-0-1)
        -   [Version 3.0.0](#Version-3-0-0)
    -   [All options in alphabetical order:](#all-options-in-alphabetical-order)
    -   [Exclusions](#exclusions)
    -   [Examples](#examples)
    -   [Clarifications](#clarifications)
    -   [Custom format](#custom-format)
    -   [Requiring](#requiring)
    -   [Debugging](#debugging)
    -   [How Licenses are Found](#how-licenses-are-found)
    -   [Related information sources on the internet](#related-information-sources-on-the-internet)
`version` can either be an exact version or a semver range, multiple ranges are supported for a single package, for example:

## <a id="a-message-from-the-maintainer"></a>A message from the maintainer

Folks, I love and honor open software (the latter not as much as I should), and therefore I am a little ashamed of the lack of regular care I give to this project. My family (two still young kids and a wife working full-time just as me) plus my hobbies (reading - currently I read the great book "Coders at work" and plan to work my way through "Structure and interpretation of computer programs", a book many great and experienced coders say is kind of a must-read - and homebrewing) take their toll. And then there's the time I need for procrastination as well. You get the picture.
I took over this project from another guy who initially built it, because he did not respond to any PRs or emails for years and I needed a feature that was not available. And I thought there are enough people out there that should profit from what I do, so I forked the `license-checker` under the now pretty clumpsy name `license-checker-rseidelsohn` - here we are.
I am always happy when I see PR's being created by other coders out there or if someone writes me an email - no matter what it might be about. Just the feeling that this tool and what I do with it does not only live in the void is already amazing to me.
This being said, I am really looking for more people that want to contribute, so feel free if you want to be added as maintainers.
But also, I am now working for Springer Nature since mid of february, and this awesome employer (I can only and absolutely recommend working for Springer Nature, and I get no advantages whatsoever through this message - they don't even know about it!) gives their devs a 10% friday every 2nd friday, where the devs are not disturbed by any meetings and are free to work on whatever they wish (preferrably anything that helps improving their skills and/or the code base), and I plan to take this open source project and maintain it during that time. So I would like to give you hope that the updates will come more frequently and in better quality.

Berlin, 1st of April 2023.

## <a id="introduction"></a>Introduction

_This is a fork of davglass' [license-checker v.25.0.1](https://github.com/davglass/license-checker/releases/tag/v25.0.1) - Since that code doesn't seem to be updated regularly, I created this fork for being able to adding new features and fixing bugs._

_I changed the original `exclude` argument to `excludeLicenses` in order to prevent confusion and better align it with the `excludePackages` argument. Also, the argument `includeLicenses` has been added for listing only packages that include the licenses listed._

**Please notice:** Version 1.2.2 is the last version working fine on node v12. From Version 2 on, you will need at least Node v14 to run this NPM license checker. Thanks to @daniel-schulz for pointing this out!

Ever needed to see all the license info for a module and its dependencies?

It's this easy:

```shell
npm install -g license-checker-rseidelsohn

mkdir foo
cd foo
npm install yui-lint
license-checker-rseidelsohn
```

You should see something like this:

```ascii
├─ cli@0.4.3
│  ├─ repository: http://github.com/chriso/cli
│  └─ licenses: MIT
├─ glob@3.1.14
│  ├─ repository: https://github.com/isaacs/node-glob
│  └─ licenses: UNKNOWN
├─ graceful-fs@1.1.14
│  ├─ repository: https://github.com/isaacs/node-graceful-fs
│  └─ licenses: UNKNOWN
├─ inherits@1.0.0
│  ├─ repository: https://github.com/isaacs/inherits
│  └─ licenses: UNKNOWN
├─ jshint@0.9.1
│  └─ licenses: MIT
├─ lru-cache@1.0.6
│  ├─ repository: https://github.com/isaacs/node-lru-cache
│  └─ licenses: MIT
├─ lru-cache@2.0.4
│  ├─ repository: https://github.com/isaacs/node-lru-cache
│  └─ licenses: MIT
├─ minimatch@0.0.5
│  ├─ repository: https://github.com/isaacs/minimatch
│  └─ licenses: MIT
├─ minimatch@0.2.9
│  ├─ repository: https://github.com/isaacs/minimatch
│  └─ licenses: MIT
├─ sigmund@1.0.0
│  ├─ repository: https://github.com/isaacs/sigmund
│  └─ licenses: UNKNOWN
└─ yui-lint@0.1.1
   ├─ licenses: BSD
   └─ repository: http://github.com/yui/yui-lint
```

An asterisk next to a license name means that it was deduced from
an other file than package.json (README, LICENSE, COPYING, ...)
You could see something like this:

```ascii
└─ debug@2.0.0
   ├─ repository: https://github.com/visionmedia/debug
   └─ licenses: MIT*
```

## <a id="changes"></a>Changes (see a more detailed and always up-to-date list [here](https://github.com/RSeidelsohn/license-checker-rseidelsohn/releases))

### <a id="Version-4-4-2"></a>Version 4.4.2

fix: Fix missing file name ending (sorry for these)

### <a id="Version-4-4-1"></a>Version 4.4.1

fix: Fix errors that broke the whole new version (sorry for these)

### <a id="Version-4-4-0"></a>Version 4.4.0

chore(deps-dev): bump braces from 3.0.2 to 3.0.3 by @dependabot in https://github.com/RSeidelsohn/license-checker-rseidelsohn/pull/114
chore: only include necessary files in package by @ol-teuto in https://github.com/RSeidelsohn/license-checker-rseidelsohn/pull/106
feat: allow specifying ranges in clarifications file and add strict usage checking for them by @ol-teuto in https://github.com/RSeidelsohn/license-checker-rseidelsohn/pull/110
feat: Add new option `clarificationsMatchAll` by @ol-teuto

### <a id="Version-4-3-1"></a>Version 4.3.1

misc: Move from `require` to `import` in all the files
misc: Update indexHelpers.js by @ArsArmandi in https://github.com/RSeidelsohn/license-checker-rseidelsohn/pull/108

### <a id="Version-4-3-0"></a>Version 4.3.0

feat: Add numeric "--depth" option that overrides the ambiguous "--direct" option
fix: Fix local anchors in the README

### <a id="Version-4-2-11"></a>Version 4.2.11

misc: Rename a variable and use correct value for exact comparison
fix: Fix ts definition issue
update: Merge Dependabot update of @babel/code-frame

### <a id="Version-4-2-10"></a>Version 4.2.10

fix: Fixes broken `--direct` attribute

### <a id="Version-4-2-9"></a>Version 4.2.9

fix: Fixes broken refactoring from version 4.2.7, closes #94

### <a id="Version-4-2-8"></a>Version 4.2.8

fix: methods from exports instead of global this (@chohner), closes #95

### <a id="Version-4-2-7"></a>Version 4.2.7

chore(deps-dev): bump word-wrap from 1.2.3 to 1.2.4
chore(deps): bump semver from 7.3.5 to 7.5.2

fix: Consider out option also when passed to programmatic interface, fixes #42

### <a id="Version-4-2-6"></a>Version 4.2.6

fix: The bug under Windows, where @scope packages had been ignored, should be fixed now

### <a id="Version-4-2-5"></a>Version 4.2.5

fix: Provide safe defaults for desctructured argument object

### <a id="Version-4-2-4"></a>Version 4.2.4

Improve the detection of URLs as licenses which are no licenses at all. Previously, when no license info could be found elsewhere, any URL in the README was taken as a custom license, which is not a very bulletproof method. Now, I restrict this method which was probably meant as a fallback solution to only being considered if the README contains at least the word "license" in some form (or notation). Not good, but better than before.

### <a id="Version-4-2-3"></a>Version 4.2.3

Fix `--relativeModulePath` not working in combination with `--start`.

### <a id="Version-4-2-2"></a>Version 4.2.2

Fix a bug that produced incorrect relative license file paths when using `--relativeLicensePath` together with `--files` and `--out`.

### <a id="Version-4-2-1"></a>Version 4.2.1

Refactor many more parts of the still old code, extracting more functionality into separate functions and files and providing more descriptive argument, variable and function names.
Also, add a new test and improve the algorithm for finding licenses that are URLs - this previously used to catch image URLs thet quite often appear in the README file as licenses although license information was already correctly provided in the package.json. This part of the code is still subject to improvements, but for now it works better than before.
Also, some minor bugs in the code have been fixed.
All in all I did a lot of refactoring for helping me with future improvements (bug fixes and new features), as the code now is easier to understand than before (and still is a pretty big mess to me).

### <a id="Version-4-2-0"></a>Version 4.2.0

Add the option `--clarificationsFile [filepath]` for a A file that describe the license clarifications for each package, see clarificationExample.json, any field available to the customFormat option can be clarified. The clarifications file can also be used to specify a subregion of a package's license file (instead reading the entire file).

### <a id="Version-4-1-1"></a>Version 4.1.1

Fix list format when outputting markdown format

### <a id="Version-4-1-0"></a>Version 4.1.0

Change config that required the major npm version to be 8. This led to code not compiling for some users and was done for no good reason. Now it is required to be >= 8.

### <a id="Version-4-0-1"></a>Version 4.0.1

Fix some typos in the README file.

### <a id="Version-4-0-0"></a>Version 4.0.0

Due to [end of service for NodeJS' security updates](https://endoflife.date/nodejs), I decided to from now on use a current LTS-version, which is NodeJS v18.

This of course doesn't necessarily mean that older Node versions will not be able to run this license-checker-rseidelsohn, but one day this will mosrt likely happen, I guess.

Should there be any need for security updates or new features supported by older NodeJS versions, [please tell me so] (mailto:rseidelsohn@gmail.com?subject=Support%20request%20for%20old%20license-checker-rseidelsohn%20-%20version). I can not promise that I will take the time to fulfill the request, but if you do not ask me, I certainly won't.

This being said, the only change with 4.0.0 is a switch in the `.nvmrc` file of the project (for developers working on this module only) from NodeJS v14 to NodeJS v18 - which again is a LTS version, a version with long time support - and some minor updates to the README file, adding stuff that was missing in the past due to a lack of regular maintenance from my side.

That then being said, I really want to invite you to add pull requests to this project. If you feel like, please ask me to give you higher-level access to this repo. I am not keen on mainaining it on my own - I just took it over in order to add my own feature request after the original author stopped finding the time to further support it. Now, I am not using this module for work any more (which might change in the future), but I see my responsibility to at least taking care of pull requests and releasing them, and from time to time working on feature requests as a kind of kata for me.

### <a id="Version-3-3-0"></a>Version 3.3.0

Allow combining the options `--excludePackages` and `--excludePackagesStartingWith`

### <a id="Version-3-2-1"></a>Version 3.2.1

Bugfix for `--excludePackagesStartingWith`

### <a id="Version-3-2-0"></a>Version 3.2.0

Add flag `--excludePackagesStartingWith [list]` and add detection of `Hippocratic License 2.1`

### <a id="Version-3-1-0"></a>Version 3.1.0

Add new option `--limitAttributes`. Example usage: `node bin/license-checker-rseidelsohn --limitAttributes publisher,email` will only list the `publisher` and `email` attributes for every dependency.

### <a id="Version-3-0-1"></a>Version 3.0.1

Fix the `--direct` option.

### <a id="Version-3-0-0"></a>Version 3.0.0

From now on, when you give the `--files` option, this tool outputs the path to the _copied_ license files rather than to
the originals. When the `relativeLicensePath` option is given, this path will either be relative to the working
directory or - if also the `out` option is given - relative to the `out` path.

When using the `--out` option, you will not see output in the console, as the output goes into the file specified by
`--out`. When using the `--files` option without `--out` option, you will now get console output, which was not the case
before.

## <a id="all_options_in_alphabetical_order"></a>All options in alphabetical order

-   `--angularCli` is just a synonym for `--plainVertical`
-   `--clarificationsFile [filepath]` A file that describe the license clarifications for each package, see clarificationExample.json, any field available to the customFormat option can be clarified. The clarifications file can also be used to specify a subregion of a package's license file (instead reading the entire file)
-   `--clarificationsMatchAll [boolean]` This optional new feature is still lacking a description - to be done
-   `--csv` output in csv format
-   `--csvComponentPrefix` prefix column for component in csv format
-   `--customPath` to add a custom Format file in JSON
-   `--depth [number]` look for "number" of levels of dependencies - overrides the ambiguously named "--direct" option'
-   `--development` only show development dependencies.
-   `--direct [boolean|number]` look for direct dependencies only if "true" or look for "number" of levels of dependencies
-   `--excludeLicenses [list]` exclude modules which licenses are in the comma-separated list from the output
-   `--excludePackages [list]` restrict output to the packages (either "package@fullversion" or "package@majorversion" or only "package") not in the semicolon-seperated list
-   `--excludePackagesStartingWith [list]` exclude modules which names start with the comma-separated list from the output (useful for excluding modules from a specific vendor and such). Example: `--excludePackagesStartingWith "webpack;@types;@babel"`
-   `--excludePrivatePackages` restrict output to not include any package marked as private
-   `--failOn [list]` fail (exit with code 1) on the first occurrence of the licenses of the semicolon-separated list
-   `--files [path]` copy all license files to path and rename them to `module-name`@`version`-LICENSE.txt
-   `--includeLicenses [list]` include only modules which licenses are in the comma-separated list from the output
-   `--includePackages [list]` restrict output to the packages (either "package@fullversion" or "package@majorversion" or only "package") in the semicolon-seperated list
-   `--json` output in json format
-   `--limitAttributes [list]` limit the attributes to be output
-   `--markdown` output in markdown format
-   `--nopeer` skip peer dependencies in output
-   `--onlyAllow [list]` fail (exit with codexclusionse 1) on the first occurrence of the licenses not in the semicolon-seperated list
-   `--onlyunknown` only list packages with unknown or guessed licenses
-   `--out [filepath]` write the data to a specific file
-   `--plainVertical` output license info in plain vertical format like [Angular CLI does](https://angular.io/3rdpartylicenses.txt)
-   `--production` only show production dependencies.
-   `--relativeLicensePath` output the location of the license files as relative paths
-   `--relativeModulePath` output the location of the module files as relative paths
-   `--start [filepath]` path of the initial json to look for
-   `--summary` output a summary of the license usage',
-   `--unknown` report guessed licenses as unknown licenses
-   `--version` The current version
-   `--help` The text you are reading right now :)

## <a id="exclusions"></a>Exclusions

A list of licenses is the simplest way to describe what you want to exclude.

You can use valid [SPDX identifiers](https://spdx.org/licenses/).
You can use valid SPDX expressions like `MIT OR X11`.
You can use non-valid SPDX identifiers, like `Public Domain`, since `npm` does
support some license strings that are not SPDX identifiers.

## <a id="examples"></a>Examples

```
license-checker-rseidelsohn --json > /path/to/licenses.json
license-checker-rseidelsohn --csv --out /path/to/licenses.csv
license-checker-rseidelsohn --unknown
license-checker-rseidelsohn --customPath customFormatExample.json
license-checker-rseidelsohn --excludeLicenses 'MIT, MIT OR X11, BSD, ISC'
license-checker-rseidelsohn --includePackages 'react@16.3.0;react-dom@16.3.0;lodash@4.3.1'
license-checker-rseidelsohn --excludePackages 'internal-1;internal-2'
license-checker-rseidelsohn --onlyunknown
```

## <a id="clarifications"></a>Clarifications

The `--clarificationsFile` option can be used to provide custom processing instructions on a per-package basis. The format is as so:

```json5
{
    "package_name@version": {
        // Any field available in customFormat can be clarified
        "licenses": "MIT",
        "licenseFile": "some/path",
        "licenseText": "The full text of the license to include if you need"
        // You can optionally add a SH-256 checksum of the license file contents that will be checked on each run. Intended to help detect when projects change their license.
        "checksum": "deadbeef...",
        // Add a licenseStart and optional licenseEnd to snip out a substring of the licenseText. The licenseStart will be included in the licenseText, the licenseEnd will not be.
        "licenseStart": "# MIT License",
        "licenseEnd": "=========",
    }
}
```

`version` can either be an exact version or a semver range, multiple ranges are supported for a single package, for example:

```json5
{
    "package_name@^1": {
        // Any field available in customFormat can be clarified
        "licenses": "GPL",
        // ... other fields, see above
    },
    "package_name@^2": {
        // Any field available in customFormat can be clarified
        "licenses": "MIT",
        // ... other fields, see above
    },
}
```

For overlapping ranges, the first matching entry is used.

The `--clarificationsMatchAll` option, when enabled, raises an error if not all specified clarifications were used, it is off by default.

<a name="custom_format"></a>

## Custom format

The `--customPath` option can be used with CSV to specify the columns. Note that
the first column, `module_name`, will always be used.

When used with JSON format, it will add the specified items to the usual ones.

The available items are the following:

-   copyright
-   description
-   email
-   licenseFile
-   licenseModified
-   licenses
-   licenseText
-   name
-   publisher
-   repository
-   url
-   version

You can also give default values for each item.
See an example in [customFormatExample.json](customFormatExample.json).

Note that outputting the license text is not recommended with Markdown formatting, as it can be very long and does not work well with Markdown lists.

## <a id="requiring"></a>Requiring

```js
var checker = require('license-checker-rseidelsohn');

checker.init(
    {
        start: '/path/to/start/looking',
    },
    // eslint-disable-next-line no-unused-vars
    function (err, packages) {
        if (err) {
            //Handle error
        } else {
            //The sorted package data
            //as an Object
        }
    },
);
```

## <a id="debugging"></a>Debugging

license-checker uses [debug](https://www.npmjs.com/package/debug) for internal logging. There’s two internal markers:

-   `license-checker-rseidelsohn:error` for errors
-   `license-checker-rseidelsohn:log` for non-errors

Set the `DEBUG` environment variable to one of these to see debug output:

```shell
$ export DEBUG=license-checker-rseidelsohn*; license-checker-rseidelsohn
scanning ./yui-lint
├─ cli@0.4.3
│  ├─ repository: http://github.com/chriso/cli
│  └─ licenses: MIT
# ...
```

## <a id="all_options_in_alphabetical_order"></a>How Licenses are Found

We walk through the `node_modules` directory with the [`read-installed-packages`](https://www.npmjs.org/package/read-installed-packages) module. Once we gathered a list of modules we walk through them and look at all of their `package.json`'s, We try to identify the license with the [`spdx`](https://www.npmjs.com/package/spdx) module to see if it has a valid SPDX license attached. If that fails, we then look into the module for the following files: `LICENSE`, `LICENCE`, `COPYING`, & `README`.

If one of the those files are found (in that order) we will attempt to parse the license data from it with a list of known license texts. This will be shown with the `*` next to the name of the license to show that we "guessed" at it.

## <a id="related_information_sources_on_the_internet"></a>Related information sources on the internet

-   [ChooseALicense.com](https://choosealicense.com/) - aims at helping you in choosing an open source license for your project
-   [TLDRLegal.com](https://tldrlegal.com/) - aims at exlaining complicated legal details of software licenses in easy to understand english
