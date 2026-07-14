[![NPM](https://nodei.co/npm/license-checker-rseidelsohn.png)](https://nodei.co/npm/license-checker-rseidelsohn/)

![Licensed under BSD-3 Clause](https://img.shields.io/npm/l/license-checker-rseidelsohn)

# NPM License Checker

## Table of Contents
-   [TL;DR](#tldr)
-   [The way forward](#way-forward)
-   [Introduction](#introduction)
-   [Description](#description)
-   [Changes](#changes)
-   [CLI options](#all-options-in-alphabetical-order)
-   [Exclusions](#exclusions)
-   [Examples](#examples)
-   [Clarifications](#clarifications)
-   [Custom format](#custom-format)
-   [Programmatic API](#importing)
-   [Debugging](#debugging)
-   [How Licenses are Found](#how-licenses-are-found)
-   [Related information sources on the internet](#related-information-sources-on-the-internet)

## <a id="introduction"></a>Introduction

### ⚠️ Deprecation notice ⚠️

**`6.0.0` is the final release of `license-checker-rseidelsohn`**.

We're moving everything over to [@lizenz/checker](https://www.npmjs.com/package/@lizenz/checker). Its initial `1.0.0`
is a 100% compatible drop-in replacement. Further development, updates, and features will happen there, as well.

### 🤔 But why?

This (admittedly oddly-named) package started as a fork of Dav Glass' "O.G."
[license-checker](https://www.npmjs.com/package/license-checker) as the original hasn't been maintained for quite some
time. The goal was to keep it up to date, to fix bugs and maybe to add a few new features here and there. Then reality
kicked in, and this package has been sitting somewhat stale for a while, too 😅. There are other forks out there, as
well. Most are pretty stale. Some have seen some activity. But overall, the landscape is a bit complicated right now.

We decided to fix this:

- create new GitHub & npm orgs so that not one single person has to be responsible going forward
- make it easier for contributors, maintainers and owners to join (and leave)
- deprecated this package here, while linking to a fresh new package, utilizing npm scopes and the aforementioned orgs
- continue development over there, hopefully encouraging other forks to join, as well

### Changes to the original

_I changed the original `exclude` argument to `excludeLicenses` in order to prevent confusion and better align it with
the `excludePackages` argument. Also, the argument `includeLicenses` has been added for listing only packages that
include the licenses listed._

## <a id="description"></a>Description

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
├─ debug@2.0.0
│  ├─ repository: https://github.com/visionmedia/debug
│  └─ licenses: MIT*
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

An asterisk next to a license name means that it was deduced from another file than package.json (README, LICENSE,
COPYING, ...).

## <a id="changes"></a>Changes

Take a look at the detailed [changelog](CHANGELOG.md) or at the
[releases page](https://github.com/RSeidelsohn/license-checker-rseidelsohn/releases).

## <a id="all-options-in-alphabetical-order"></a>CLI options

The following options are command-line flags for the `license-checker-rseidelsohn` executable. Some of the same
behavior is also available through the programmatic `runLicenseCheck` API. See [Programmatic API](#importing) for the
supported `runLicenseCheck` options and their types.

- `--angularCli` is just a synonym for `--plainVertical`
- `--clarificationsFile [filepath]` A file that describe the license clarifications for each package. See
  [clarificationExample.json](clarificationExample.json). Any field available to the customFormat option can be
  clarified. The clarifications file can also be used to specify a subregion of a package's license file (instead of
  reading the entire file)
- `--clarificationsMatchAll [boolean]` This optional new feature is still lacking a description - to be done
- `--color` colorize terminal tree output
- `--csv` output in csv format
- `--csvComponentPrefix` prefix column for component in csv format
- `--customPath` to add a custom Format file in JSON
- `--depth [number]` look for "number" of levels of dependencies - overrides the ambiguously named "--direct" option
- `--development` only show development dependencies.
- `--direct [boolean|number]` look for direct dependencies only if "true" or look for "number" of levels of dependencies
- `--excludeLicenses [list]` exclude modules which licenses are in the comma-separated list from the output
- `--excludePackages [list]` restrict output to the packages (either "package@fullversion" or "package@majorversion" or
  only "package") not in the semicolon-separated list
- `--excludePackagesStartingWith [list]` exclude modules which names start with the semicolon-separated list from the
  output (useful for excluding modules from a specific vendor and such). Example:
  `--excludePackagesStartingWith "webpack;@types;@babel"`
- `--excludePrivatePackages` restrict output to not include any package marked as private
- `--failOn [list]` fail (exit with code 1) on the first occurrence of the licenses of the semicolon-separated list
- `--files [path]` copy all license files to path and rename them to `module-name`@`version`-LICENSE.txt
- `--help` (`-h`) The text you are reading right now :)
- `--includeLicenses [list]` include only modules which licenses are in the comma-separated list from the output
- `--includePackages [list]` restrict output to the packages (either "package@fullversion" or "package@majorversion" or
  only "package") in the semicolon-separated list
- `--json` output in json format
- `--limitAttributes [list]` limit the attributes to be output
- `--markdown` output in markdown format
- `--nopeer` skip peer dependencies in output
- `--onlyAllow [list]` fail (exit code 1) on the first occurrence of the licenses not in the semicolon-separated list
- `--onlyunknown` only list packages with unknown or guessed licenses
- `--out [filepath]` write the data to a specific file
- `--plainVertical` output license info in plain vertical format like [Angular CLI does](https://angular.io/3rdpartylicenses.txt)
- `--production` only show production dependencies.
- `--relativeLicensePath` output the location of the license files as relative paths
- `--relativeModulePath` output the location of the module files as relative paths
- `--start [filepath]` path of the initial JSON to look for
- `--summary` output a summary of the license usage
- `--unknown` report guessed licenses as unknown licenses
- `--version` (`-v`) The current version

## <a id="exclusions"></a>Exclusions

A list of licenses is the simplest way to describe what you want to exclude.

You can use valid [SPDX identifiers](https://spdx.org/licenses/). You can use valid SPDX expressions like `MIT OR X11`.

You can use non-valid SPDX identifiers, like `Public Domain`, since `npm` does support some license strings that are not
SPDX identifiers.

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

The `--clarificationsFile` option can be used to provide custom processing instructions on a per-package basis. The
format is as so:

```json5
{
    "package_name@version": {
        // Any field available in customFormat can be clarified
        "licenses": "MIT",
        "licenseFile": "some/path",
        "licenseText": "The full text of the license to include if you need",
        // You can optionally add a SH-256 checksum of the license file contents that will be checked on each run.
        // Intended to help detect when projects change their license.
        "checksum": "deadbeef...",
        // Add a licenseStart and optional licenseEnd to snip out a substring of the licenseText. The licenseStart will
        // be included in the licenseText, the licenseEnd will not be.
        "licenseStart": "# MIT License",
        "licenseEnd": "=========",
    }
}
```

`version` can either be an exact version or a semver range, multiple ranges are supported for a single package, for
example:

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

The `--clarificationsMatchAll` option, when enabled, raises an error if not all specified clarifications were used, it
is off by default.

## <a id="custom-format"></a>Custom format

A custom format can be provided on the CLI with `--customPath`, or programmatically with `customFormat`. It can be used
with CSV to specify the columns. Note that the first column, `module_name`, will always be used.

When used with JSON format, it will add the specified items to the usual ones. It does not limit JSON output to only
those items. In particular, `licenses` is core result data and is still emitted even if `customFormat.licenses` is
`false`.

To limit JSON output to a fixed set of attributes, use `--limitAttributes`.

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

You can also give default values for each item. See an example in [customFormatExample.json](customFormatExample.json).

Note that outputting the license text is not recommended with Markdown formatting, as it can be very long and does not
work well with Markdown lists.

## <a id="importing"></a>Programmatic API

The documented programmatic entrypoint is `runLicenseCheck(opts)`.

```js
import { runLicenseCheck } from 'license-checker-rseidelsohn';

const packages = await runLicenseCheck({ start: '/path/to/start/looking' });

// The sorted package data as an Object
console.log(packages);
```

If an error occurred, the returned promise rejects. If the checker ran successfully, the promise resolves to an object
keyed by package name plus version.

Bugfix note: library code no longer terminates the host process for license policy or clarification failures. These
failures are now reported via rejected `runLicenseCheck` promise. CLI behavior remains unchanged.

Supported `runLicenseCheck` options (alphabetically):

| Option                        | Type                                           | Description                                                                                                                  |
|-------------------------------|------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| `clarificationsFile`          | `string`                                       | Path to a JSON file with package-specific license clarifications.                                                            |
| `clarificationsMatchAll`      | `boolean`                                      | Fail the run if any clarification entry was not used.                                                                        |
| `color`                       | `boolean`                                      | Colorize license strings in the returned data where the checker emits colorized license values.                              |
| `csv`                         | `boolean`                                      | Format file output as CSV when `out` is set.                                                                                 |
| `csvComponentPrefix`          | `string`                                       | Add a component prefix column to CSV output.                                                                                 |
| `customFormat`                | `Record<string, string \| false \| undefined>` | Custom output fields and default values.                                                                                     |
| `customPath`                  | `string`                                       | Path to a JSON file that defines a custom output format.                                                                     |
| `development`                 | `boolean`                                      | Only include development dependencies.                                                                                       |
| `direct`                      | `number`                                       | Limit dependency recursion by depth. Use `0` for direct dependencies only.                                                   |
| `excludeLicenses`             | `string`                                       | Comma-separated list of licenses to exclude.                                                                                 |
| `excludePackages`             | `string`                                       | Semicolon-separated list of packages to exclude. Entries can be `package`, `package@majorversion`, or `package@fullversion`. |
| `excludePackagesStartingWith` | `string`                                       | Semicolon-separated list of package-name prefixes to exclude.                                                                |
| `excludePrivatePackages`      | `boolean`                                      | Exclude packages marked as private.                                                                                          |
| `failOn`                      | `string`                                       | Semicolon-separated list of licenses that should fail the run when found.                                                    |
| `files`                       | `string`                                       | Copy detected license files to the given directory.                                                                          |
| `includeLicenses`             | `string`                                       | Comma-separated list of licenses to include.                                                                                 |
| `includePackages`             | `string`                                       | Semicolon-separated list of packages to include. Entries can be `package`, `package@majorversion`, or `package@fullversion`. |
| `json`                        | `boolean`                                      | Format file output as JSON when `out` is set.                                                                                |
| `nopeer`                      | `boolean`                                      | Skip peer dependencies.                                                                                                      |
| `onlyAllow`                   | `string`                                       | Semicolon-separated list of licenses that are allowed.                                                                       |
| `onlyunknown`                 | `boolean`                                      | Only include packages with unknown or guessed licenses.                                                                      |
| `out`                         | `string`                                       | Write formatted output to a file.                                                                                            |
| `production`                  | `boolean`                                      | Only include production dependencies.                                                                                        |
| `relativeLicensePath`         | `boolean`                                      | Return license file paths relative to the scanned package path.                                                              |
| `relativeModulePath`          | `boolean`                                      | Return module paths relative to the scanned package path.                                                                    |
| `start`                       | `string`                                       | Path to start checking dependencies from.                                                                                    |
| `unknown`                     | `boolean`                                      | Report guessed licenses as unknown licenses.                                                                                 |

The following command-line flags control CLI process behavior only and are not part of the documented programmatic API
options: `--help` and `--version`.

## <a id="debugging"></a>Debugging

license-checker uses [debug](https://www.npmjs.com/package/debug) for internal logging. There’s two internal markers:

- `license-checker-rseidelsohn:error` for errors
- `license-checker-rseidelsohn:log` for non-errors

Set the `DEBUG` environment variable to one of these to see debug output:

```shell
$ export DEBUG=license-checker-rseidelsohn*; license-checker-rseidelsohn
scanning ./yui-lint
├─ cli@0.4.3
│  ├─ repository: http://github.com/chriso/cli
│  └─ licenses: MIT
# ...
```

## <a id="how-licenses-are-found"></a>How Licenses are Found

We read the installed `node_modules` dependency tree with npm's [`@npmcli/arborist`](https://www.npmjs.com/package/@npmcli/arborist) module. Once we gathered a
list of modules we walk through them and look at all of their `package.json`'s, We try to identify the license with the
[`spdx`](https://www.npmjs.com/package/spdx) module to see if it has a valid SPDX license attached. If that fails, we then look into the module for the
following files: `LICENSE`, `LICENCE`, `COPYING`, & `README`.

If one of the those files are found (in that order) we will attempt to parse the license data from it with a list of
known license texts. This will be shown with the `*` next to the name of the license to show that we "guessed" at it.

## <a id="related-information-sources-on-the-internet"></a>Related information sources on the internet

- [ChooseALicense.com](https://choosealicense.com/) aims at helping you in choosing an open source license for your
  project
- [TLDRLegal.com](https://tldrlegal.com/) aims at explaining complicated legal details of software licenses in easy to
  understand English
