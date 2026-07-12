# Changelog

## 6.0.0-rc.1

This is the release candidate for the "last version" of this tool. We're planning to create a new package under a nicer
name that'll be the successor to this one. Right now, we're trying not to add new features, but consolidate the codebase
and dev setup.

The `6.0.0` will be released soon once we received some feedback and did some additional testing. We want to make the
transition to `6.0.0` (and the new package) as smooth as possible for everyone (users and contributors alike). So please
do feel free to test this RC version and send feedback if you run into any issues!

**🔨Breaking changes**
- The CLI implementation moved from `bin/license-checker-rseidelsohn.js` to `lib/cli.js`. Invoking the package through
  its installed `license-checker-rseidelsohn` executable remains supported.
- `init` function from `lib/index.js` is now deprecated in favor of the new promise-based `runLicenseCheck` function.
- The public exports of `lib/index.js` have been reduced to `init` and `runLicenseCheck`. Previously exported internal
  formatting and helper functions are no longer exported.
- Programmatic license-policy and clarification failures no longer terminate the host process. `runLicenseCheck` now
  rejects its promise, while the deprecated `init` API reports the error through its callback. The CLI continues to exit
  with a non-zero status for these failures.
- Generated TypeScript declarations are now provided at `dist/lib/index.d.ts`, replacing the outdated, handwritten,
  slightly incorrect declarations.

**🐥 New features**
- Promise-based programmatic entry point `runLicenseCheck` to simplify usage.
- Better (and actually correct) TypeScript definitions.

**🐛 Bug fixes**

- Restored CLI output formats other than JSON, including CSV, Markdown, summary, plain-vertical and tree output.
- `--version` now reports the version from `package.json` instead of a stale hard-coded version.

**🧹 Housekeeping / internal stuff**
- Cleaned up project structure, build tooling, test setup, etc.
- Prepare for full migration to TypeScript.
- Clean up / reduce dependencies.

**🪾Notable commits**

- d0046f0 feat!: updated file/directory structure (@defaude)
- 11949c7 fix: use package version for CLI output (@ekkoitac)
- 6275732 feat!: move process.exit calls into CLI-only code (@defaude)
- 7ed90a3 fix: output options other than --json now work again (@defaude)
- bb7de6e feat: remove hand-written .d.ts file in favor of one that's generated from the code (@defaude)
- 70e8810 fix: align type definitions with implementation (@defaude)

### v5.0.1 (2026/05/27 14:15 +00:00)
- 2f83a3b 5.0.1 (@defaude)
- 3ec070f chore: update changelog (@defaude)
- 8f43b56 fix: more fixes to restore the original behavior of read-installed-packages (@defaude)
- fb88dc6 fix: properly parse dependency license information from package.json files (@defaude)

### v5.0.0 (2026/05/27 06:00 +00:00)
- 5b60e4b 5.0.0 (@defaude)
- b1e2616 chore: drop read-installed-packages dep (@defaude)
- 9d5b0d3 chore: update changelog from script (@defaude)
- 4a0b2b0 chore: update contrib script (@defaude)
- d447390 fix: init callback typing (@defaude)
- e741230 fix: work around deprecation warning for existsSync (@defaude)
- #135 Merge pull request #135 from t-tsutsumi-scc/fix/use-args.getNormalizedArguments-instead-of-removed-parse (@t-tsutsumi-scc)
- 6342c5b chore: switch to tabs instead of spaces (@defaude)
- 283db4d chore: minor README change (@defaude)
- 6a7e28f chore: clean up README (@defaude)
- 44a4984 chore: remove remnants of istanbul / eslint hint comments (@defaude)
- 6d07400 chore: apply biome's unsafe fixes + a handful of manual ones (@defaude)
- 82849ce chore: apply biome's safe fixes (@defaude)
- f3c1061 chore: completely replace eslint + prettier with biome, remove lint-staged (@defaude)
- cda9aa3 chore: add fresh biome config with some (hopefully) sane defaults (@defaude)
- 32ddb9e chore: drop old test deps (incl. coverage stuff) (@defaude)
- be6bc3c chore: drop GH publish to NPM workflow (@defaude)
- 46d1dd3 chore: add Vitest + config + migrate (and fix) existing tests (@defaude)
- 07982a0 fix: re-introduce "licence" (British English) writing style (@defaude)
- 78763e9 fix: use updated args parsing introduced with 80cbe9d (@defaude)
- efe8768 chore: get tests passing (cherry pick) (@dbjorge)
- 68d86a6 chore: drop "request" dependency (@defaude)
- f3be949 chore: remove CodeQL workflow (@defaude)
- 3215a09 chore: remove Travis config file (@defaude)
- 15195f7 chore!: switch to node 24 (current active LTS) (@defaude)
- 77121c9 Add CODEOWNERS file (@RSeidelsohn)
- caf0dd0 Add homepage entry to the package.json file (@RSeidelsohn)
- 8aa6f38 Apply formatting rules to main script (@RSeidelsohn)
- 751cace Run npm audit fix (@RSeidelsohn)
- cdc3754 Remove the now ignored file 'Session.vim' from repository (@RSeidelsohn)
- 666032a Update nodejs version in .tool-versions file as well (@RSeidelsohn)
- 5b73744 Update Node versions and use the right ignore file for Session.vim files (@RSeidelsohn)
- fcea4f0 Add Session.vim file to .gitignore (@RSeidelsohn)
- 9a0b31f fix(cli): use args.getNormalizedArguments instead of removed parse (@t-tsutsumi-scc)
- 5e9c33c Remove accidentally duplicated array elements, change indentation and more (@RSeidelsohn)
- 85ca779 Change 4 spaces indentation to tabs (@RSeidelsohn)
- 7a26352 Update a few dependencies and add TS type definitions (@RSeidelsohn)
- ed099cc Change 4 spaces indentation to tabs (@RSeidelsohn)
- 206076a Use refactored function names from imported "args.js" (@RSeidelsohn)
- b8e08c9 Add missing "depth" parameter and change indentation (@RSeidelsohn)
- 22787bb Refactor code (@RSeidelsohn)
- 80cbe9d Refactor code (@RSeidelsohn)
- 5ef6d49 Add "use tabs" rule to the prettier configuration as well (@RSeidelsohn)
- d214b23 Delete an accidentally duplicated line (@RSeidelsohn)
- fe10bbf Add .zed folder to .gitignore (@RSeidelsohn)
- 990b7bc Change ESLint indentation rule from 4 spaces to tabs (@RSeidelsohn)
- b92c14f Apply prettier formatting (@RSeidelsohn)

### v4.4.2 (2024/09/09 05:28 +00:00)
- e262866 Bump fix version (@RSeidelsohn)
- #119 Merge pull request #119 from kriths/master (@kriths)
- 3f306ee Fix path to executable (@kriths)

### v4.4.1 (2024/08/30 09:29 +00:00)
- c78518f Fix errors and update formatting (@RSeidelsohn)

### v4.4.0 (2024/08/30 09:12 +00:00)
- da24ced Update new release description (@RSeidelsohn)
- e8e169c Fix copy&paste errors, update version & description (@RSeidelsohn)
- #110 Merge pull request #110 from ol-teuto/clarifications-semver (@ol-teuto)
- 140b7f9 Merge branch 'master' into clarifications-semver (@RSeidelsohn)
- #106 Merge pull request #106 from ol-teuto/slim-package (@ol-teuto)
- #114 Merge pull request #114 from RSeidelsohn/dependabot/npm_and_yarn/braces-3.0.3 (@RSeidelsohn)

### v4.3.1 (2024/08/30 08:28 +00:00)
- 00684f9 Bump version number (@RSeidelsohn)
- f196d70 Replace require with import all over the place (@RSeidelsohn)
- 3d52756 Replace require with import all over the place (@RSeidelsohn)
- 28b3370 chore(deps-dev): bump braces from 3.0.2 to 3.0.3 (@dependabot[bot])
- 14fabdd Another try to fix the local markdown anchor tags (@RSeidelsohn)
- 48bcfd7 Fix the broken local links in the README (@RSeidelsohn)
- #108 Merge pull request #108 from ArsArmandi/patch-1 (@ArsArmandi)
- 4b6ac36 document clarifications file semver ranges (@ol-teuto)
- c019f8f allow specifying ranges in clarifications file and add strict usage checking for them (@ol-teuto)
- bf950fc Update indexHelpers.js (@ArsArmandi)
- ff3928d chore: only include necessary files in package (@ol-teuto)

### v4.3.0 (2023/12/08 14:22 +00:00)
- 3918843 docs: Update CHANGELOG
- d970d35 feat: Add numeric "--depth" option that overrides the ambiguous "--direct" option
- dbff514 docs: Update CHANGELOG
- 52cbb7c Rename variable and compare with correct value
- 35f9806 chore: Bump version
- c523274 Fix ts definition issue
- #100 Merge pull request #100 from RSeidelsohn/dependabot/npm_and_yarn/babel/traverse-7.23.2 (@RSeidelsohn)
- 5e1f619 chore(deps-dev): bump @babel/traverse from 7.21.5 to 7.23.2 (@dependabot[bot])

### v4.2.10 (2023/10/13 15:28 +00:00)
- #99 Merge pull request #99 from RSeidelsohn/release-4-2-10 (@RSeidelsohn)
- 47e5432 Merge branch 'master' into release-4-2-10 (@RSeidelsohn)
- a4f0029 chore: Bump version (@RSeidelsohn)
- acebf61 docs: Add changes to README (@RSeidelsohn)
- 64dc943 fix: Fix the broken direct attribute
- 9c0099d WIP
- 5084e29 chore: Update nopt version from 5.0.0 to 7.2.0
- 5616994 docs: Try to fix the markdown rendering glitch
- 303b7f7 docs: Add more documentation to a function

### v4.2.9 (2023/10/13 11:52 +00:00)
- b767852 docs: Add latest change to README
- 7833444 refactor: Use easier to understand functions and variable names
- 69bd393 chore: Bump version
- 94a363a fix: Revert breaking refactoring
- 72ebae0 chore: Bump version and update changes (@RSeidelsohn)
- 0c3fe21 config: Add .tool-versions file (@RSeidelsohn)
- e549812 chore: Update contributors list (@RSeidelsohn)
- #96 Merge pull request #96 from chohner/fix_exports_methods (@chohner)
- 7d25eb8 fix: methods from exports instead of global this (@chohner)

### v4.2.7 (2023/09/15 16:36 +00:00)
- a43c400 docs: Update CHANGELOG
- e0ad9bf test: Update tests after dependency updates
- 005ae12 refactor: Simplify and secure two helper functions
- 3e60e41 fix: Fix wrong merge
- d72111b fix: Remove broken husky for now
- 3fb8672 chore: Bump version, run audit fix and update README
- #93 Merge pull request #93 from Linko91/patch-1 (@Linko91)
- #81 Merge pull request #81 from sportsracer/fix-programmatic-out-option (@sportsracer)
- 8387216 Merge branch 'master' into fix-programmatic-out-option (@RSeidelsohn)
- #86 Merge pull request #86 from RSeidelsohn/dependabot/npm_and_yarn/semver-7.5.2 (@RSeidelsohn)
- #90 Merge pull request #90 from RSeidelsohn/dependabot/npm_and_yarn/word-wrap-1.2.4 (@RSeidelsohn)
- 2c3bfb4 docs: Add description of changes in new version
- 5593636 updated "direct" type on index.d.ts (@Linko91)
- ee849aa chore(deps-dev): bump word-wrap from 1.2.3 to 1.2.4 (@dependabot[bot])
- d697656 chore(deps): bump semver from 7.3.5 to 7.5.2 (@dependabot[bot])
- #80 Merge pull request #80 from RSeidelsohn/dependabot/npm_and_yarn/flat-and-jenkins-mocha-5.0.2 (@RSeidelsohn)

### v4.2.6 (2023/06/09 10:25 +00:00)
- #85 Merge pull request #85 from RSeidelsohn/release_4.2.6 (@RSeidelsohn)
- 6c7cfbb doc: Create a changelog
- c16b8a3 chore: Bump version
- 235cc2a fix: Update read-installed-packages to 2.0.1
- 3b8cb4c refactor: Create helper function and use explicit node: in requires
- 713f680 refactor: Extract a small functionality into a helper function
- 806bc46 refactor: Combine early return conditions
- 92c5a6a docs: Make comment more explicit
- 4063551 refactor: Refactor and reorder constant and variable definitions
- ca76b0f refactor: Move getCsvData and getCsvHeaders functions to index helpers
- 0b500dd refactor: Increase type safety and simplify code
- a3203f5 refactor: Move getOptionArray function to index helpers
- eb87e1b refactor: Add a comment and increase type safety a bit
- cbbbba4 refactor: Increase understandability of function
- d7d069b Fix: Consider out option also when passed to programmatic interface (@steffen-workpath)
- 8b94df8 docs: Add a few more comments to the code
- 257c35b chore(deps): bump flat and jenkins-mocha (@dependabot[bot])
- 25ec20a docs: Improve the usage message
- edca92f refactor: Improve readability
- #79 Merge pull request #79 from RSeidelsohn/dependabot/npm_and_yarn/yaml-2.2.2 (@RSeidelsohn)
- 16475cf chore(deps): bump yaml from 2.2.1 to 2.2.2 (@dependabot[bot])

### v4.2.5 (2023/04/16 19:26 +00:00)
- #76 Merge pull request #76 from RSeidelsohn/release_4_2_5 (@RSeidelsohn)
- 2535c96 chore: Increase fix version number
- 491b5dc docs: Add description for the latest change
- d581f46 fix: Provide safe defaults for destructured argument object

### v4.2.4 (2023/04/16 18:35 +00:00)
- #75 Merge pull request #75 from RSeidelsohn/release_4_2_4 (@RSeidelsohn)
- 255d9a5 chore: Increase fix version number
- aea0c2a test: Let the URL check tests pass and add new test
- 42b67ec docs: Add description for the latest change
- 0425c1d refactor: Rename regular expression constants and add one check

### v4.2.3 (2023/04/16 14:24 +00:00)
- 5d38eda test: comment blocked test back in
- 078b593 chore: Bump fix version
- 96b3f1e docs: Add change description for new fix version
- 3c83772 fix: Fix `--relativeModulePath` using absolute paths when used with `--start`
- 86a5bea docs: Add latest change info to README (@RSeidelsohn)

### v4.2.2 (2023/04/16 11:05 +00:00)
- #74 Merge pull request #74 from RSeidelsohn/release-4-2-2 (@RSeidelsohn)
- 2d92105 chore: Increase fix version number (@RSeidelsohn)
- bd6a385 fix: Fix relative path calculation (@RSeidelsohn)

### v4.2.1 (2023/04/15 09:48 +00:00)
- #73 Merge pull request #73 from RSeidelsohn/release_4_2_1 (@RSeidelsohn)
- 681ccfa docs: Update the version history in the README file (@RSeidelsohn)
- 62f95a1 docs: Update the options usage description (@RSeidelsohn)
- b8cbb84 chore: Add new contributors (@RSeidelsohn)
- 567ed5e config: Lower the coverage limits for now (@RSeidelsohn)
- 8f738fb fix: Fix a sneaked in bug (@RSeidelsohn)
- 429d389 fix: Fix a typo (@RSeidelsohn)
- a4f7651 style: Remove a surplus empty line (@RSeidelsohn)
- c5a35f3 refactor: Provide a better name for a variable (@RSeidelsohn)
- ddf7cd7 fix: Try to skip "license" URLs ending with image file name endings (@RSeidelsohn)
- 2e7d98c style: Delete empty line between comment and code (@RSeidelsohn)
- 4697087 refactor: Move functionality into helpers and simplify exports (@RSeidelsohn)
- 13c7656 refactor: Make code a bit safer (@RSeidelsohn)
- 369f1d4 fix: Fix function parameters to strings and add documentation (@RSeidelsohn)
- 817d7e0 refactor: Use a clearer argument name and provide a default value (@RSeidelsohn)
- 8540df0 refactor: Move condition check after possible premature returns (@RSeidelsohn)
- d907eac refactor: Provide a better name for the required index file. (@RSeidelsohn)
- d24e338 fix: Fix typos (@RSeidelsohn)
- 8008280 fix: Split helpers module in two files, so they can be required by two files (@RSeidelsohn)
- 9b8ea62 refactor: Extract functionality to helper module file (@RSeidelsohn)
- 01c2a06 refactor: Move getFirstNotUndefinedOrUndefined into helpers module file (@RSeidelsohn)
- f1cf146 refactor: Extract functionality into helper functions (@RSeidelsohn)
- 39554ab refactor: Delete superfluous condition check (@RSeidelsohn)
- 54b43bd fix: Fix typo and remove TODO comment (@RSeidelsohn)
- 733553d refactor: Use a better argument name (@RSeidelsohn)
- 25fcb16 refactor: Extract function into helpers module file (@RSeidelsohn)
- 1be32a5 refactor: Move variable declarations inside the block they belong to (@RSeidelsohn)
- 8f403f7 style: Convert snake case into camel case (@RSeidelsohn)
- 30aee71 style: Move comment into a prettier-satisfying position (@RSeidelsohn)
- 7a4f006 refactor: Use a better name for the depth argument (@RSeidelsohn)
- 03c69ee chore: Increase fix version number in package.json (@RSeidelsohn)
- e445e7f refactor: Provide a better name for function argument (@RSeidelsohn)
- 47904c3 fix: Fix the function for restricting to direct dependencies (@RSeidelsohn)
- cb0e96a docs: Fix contents of function description (@RSeidelsohn)
- 3c35163 refactor: Improve normalizing of "direct" argument and remove superfluous function (@RSeidelsohn)
- 287e91e refactor: Rename knownOpts to knownOptions and getParsedArgs to getParsedArguments (@RSeidelsohn)
- 98d475d refactor: Bring back alphabetical sort order to knownOpts params (@RSeidelsohn)
- b44fc19 refactor: Use a better name for the json result from the checker (@RSeidelsohn)
- cc750b0 docs: Improve warning message (@RSeidelsohn)
- cb83ebb refactor: Reorder imports and constants in the file's head (@RSeidelsohn)
- aa1e840 refactor: Extract premature process exits and warnings into separate module file (@RSeidelsohn)
- 8cef34c refactor: Extract helper functions into separate module file (@RSeidelsohn)
- 66cf9ab refactor: Extract usageMessage into separate file (@RSeidelsohn)
- 0c19d56 fix: Correct a typo (@RSeidelsohn)
- 6e1c7d4 refactor: Directly use "clarifications" as property and value (@RSeidelsohn)
- 766f105 docs: Add explanations for option values (@RSeidelsohn)
- 7923b06 refactor: Provide a better name for a helper function (@RSeidelsohn)
- 9fb5226 docs: Update an outdated argument name in a function's documentation (@RSeidelsohn)
- b8077ea refactor: Provide a better name for imported module function and its options (@RSeidelsohn)
- ef5a5c4 refactor: Provide a better function name and move condition to function call (@RSeidelsohn)
- 1b60109 refactor: Provide a better name for a helper function (@RSeidelsohn)
- f4788b6 refactor: Transform snake case into camel case (@RSeidelsohn)
- 129b6aa docs: Add a todo note (@RSeidelsohn)
- c837b19 refactor: Provide better names for two constants (@RSeidelsohn)
- 51273de config: Add .vscode directory to .gitignore (@RSeidelsohn)
- 1b2aa50 feat: Add additional Apache version parser (@RSeidelsohn)
- ca0487d test: Comment out url license test (@RSeidelsohn)
- 7353c3f refactor: Remove superfluous code (@RSeidelsohn)
- 7d756db refactor: Provide a better name for a function (@RSeidelsohn)
- ad63417 fix: Revert arrow function to function expression (@RSeidelsohn)
- 16708c1 style: Ran prettier --fix (@RSeidelsohn)
- 5292c74 refactor: Provide better name and enhance functionality of helper function (@RSeidelsohn)
- 17dd533 style: Convert function declarations to arrow functions (@RSeidelsohn)
- 419437d fix: Fix choosing the wrong license info (@RSeidelsohn)
- 0d24dca docs: Add a TODO comment for future refactoring (@RSeidelsohn)
- 1105661 fix: Don't override custom licenses (@RSeidelsohn)
- ac79741 docs: Add documentation helping with future refactorings (@RSeidelsohn)
- a406048 refactor: Provide a better name for the content of the current license file (@RSeidelsohn)
- 3105d5a refactor: Provide a better name for the files variable (@RSeidelsohn)
- bdefc86 refactor: Restrict scope of variable and provide a better name (@RSeidelsohn)
- 622d8b2 refactor: Give the key variable a better name (@RSeidelsohn)
- 21380e9 style: Use double quotes for string with single quote inside (@RSeidelsohn)
- b3e11e0 config: Increase editorconfig's indent size from 2 to 4 (@RSeidelsohn)
- #71 Merge pull request #71 from Flydiverny/failing-test-custom-license (@Flydiverny)
- #70 Merge pull request #70 from Semigradsky/update-dependencies (@Semigradsky)
- #66 Merge pull request #66 from beawar/master (@beawar)
- #65 Merge pull request #65 from marcobiedermann/patch-1 (@marcobiedermann)
- 8165268 style: Add missing whitespace
- bf5cf27 chore: Update version number from 4.1.1 to 4.2.0 in package.json
- cf7cff8 docs: Add a message from the maintainer to the README
- 0e2b4d8 fix: add failing test for custom license URL (@Flydiverny)
- 85a2172 Update (@Semigradsky)
- d61bc3b fix: parse direct also inside init to make it work in programmatic usage (@beawar)
- 7fea720 Update README.md (@marcobiedermann)

### v4.2.0 (2023/02/18 14:18 +00:00)
- #64 Merge pull request #64 from zed-industries/clarifications-file-option (@zed-industries)
- 906b3c2 Fixed ordering or command line arguments (@mikayla-maki)
- 913fd07 Fix type (@mikayla-maki)
- fe3182e Added licenseStart and licenseEnd (@mikayla-maki)
- e67b6fc Fixed CLI help text (@mikayla-maki)
- 7397cc6 Made checksum optional (@mikayla-maki)
- a5ac9f5 Fix dropped argument in flatten recursion (@mikayla-maki)
- 97508d6 Add a --clarificationFile option (@mikayla-maki)

### v4.1.1 (2023/01/31 14:20 +00:00)
- #62 Merge pull request #62 from RSeidelsohn/release-4.1.1 (@RSeidelsohn)
- c009bbf chore: Bump patch level (@RSeidelsohn)
- 66d34af docs: Update version history in README (@RSeidelsohn)
- #60 Merge pull request #60 from slhck/fix-markdown (@slhck)
- 4739bb1 fix: markdown list format, fixes #43 (@slhck)
- #59 Merge pull request #59 from RSeidelsohn/release-3.1.0 (@RSeidelsohn)
- d991030 chore: Bump minor version (@RSeidelsohn)

### v4.1.0 (2023/01/30 09:36 +00:00)
- #58 Merge pull request #58 from RSeidelsohn/release-3.1.0 (@RSeidelsohn)
- 75f9408 config: Allow npm versions higher than 8 as well (@RSeidelsohn)

### v4.0.1 (2023/01/30 09:29 +00:00)
- #57 Merge pull request #57 from RSeidelsohn/release-3.0.1 (@RSeidelsohn)
- #56 Merge pull request #56 from Flydiverny/patch-2 (@Flydiverny)
- a88ccd7 style: Add missing spaces (@RSeidelsohn)
- 3305531 docs: Update list of contributors (@RSeidelsohn)
- f36da07 chore: Bump patch level (@RSeidelsohn)
- 92bac36 chore: fix typo (@Flydiverny)

### v4.0.0 (2023/01/21 19:43 +00:00)
- #53 Merge pull request #53 from RSeidelsohn/feature/new_major_release_4 (@RSeidelsohn)
- 0ac0f4b config: Add directories to .prettierignore file
- 8bea56c config: Remove outdated config option from .prettierrc
- 00d68a0 style: Delete trailing spaces from file
- 33379e3 Add PrettierJS integration for ESlint and lint-staged
- 5878be2 config: Add the tasks needed for lint-staged
- 3a6a3ed config: Add prettier to the ESlint configuration
- e2a740d config: Add new prettier and lint tasks to our package.json file
- fcc3393 build: Add husky for the pre-commit hook
- 1f45e6b config: Add pre-commit file for husky
- e13662b chore: Bump to new major version
- 9e42dfd build: Require a NodeJS version of 18
- 60c1f4d config: Update package-lock.json
- fa3bf91 docs: Add missing changes info to README file
- 7c286b4 docs: Add "draft mode" notice to SECURITY.md
- e6ac2ce config: Add an .editorconfig file to the project
- 1b13ca4 config: Add NodeJS and npm version information to package.json
- ff295d1 config: Add an .eslintignore file

### v3.3.0 (2023/01/21 14:42 +00:00)
- #52 Merge pull request #52 from RSeidelsohn/develop (@RSeidelsohn)
- 0eb9a7e build: Update package-lock.json file
- d4f2e4f chore: Update version
- #50 Merge pull request #50 from eugene1g/master (@eugene1g)
- 9b5f6f9 bug: Fix node version in .nvmrc file
- 918e402 fix: allow to combine `excludePackages` and `excludePackagesStartingWith` options (@eugene1g)

### v3.2.1 (2023/01/16 08:11 +00:00)
- #51 Merge pull request #51 from RSeidelsohn/develop (@RSeidelsohn)
- 38f6bba chore: Bump patch version
- ab515f9 bug: Adjust node version to check for in test
- 8dcd0db bug: Fix bug in excludePackagesStartingWith function
- 646a3a8 build: Update minor and patch versions of dependencies and devdependencies
- d84ca96 Merge branch 'master' into develop
- ca08e1a chore: Update contributor's list
- ff44a92 chore: Bump version

### v3.2.0 (2023/01/14 17:55 +00:00)
- #47 Merge pull request #47 from cezaris13/patch-1 (@cezaris13)
- #39 Merge pull request #39 from Coada/patch-1 (@Coada)
- #40 Merge pull request #40 from Coada/patch-2 (@Coada)
- #48 Merge pull request #48 from rhl2401/master (@rhl2401)
- #1 Merge pull request #1 from rhl2401/develop (@rhl2401)
- 41ec1f6 Update readme (@Naviair-RHL)
- 8686b7c Removed excludePackagesEndingWith as it was unnecessary (@Naviair-RHL)
- 9528022 Finish up (@Naviair-RHL)
- 964cbc8 FOrmat readme (@Naviair-RHL)
- 63e4883 Remove console.log (@Naviair-RHL)
- a80cf8d Added excludePackagesStartingWith (@Naviair-RHL)
- d461398 Added args (@rhl2401)
- df3e2d4 npm audit fix (@rhl2401)
- d6150f6 p.lock (@rhl2401)
- 1683c0f Updated requiring section (@cezaris13)
- adbe3cb Update getLicenseTitle.js (@coada)
- 32cc054 Hippocratic License 2.1 (@coada)
- 88fb6c7 Exclude Licenses Example (@coada)
- dd42afc Update README.md (@RSeidelsohn)
- e4363b7 Update README.md (@RSeidelsohn)
- 2f600e5 Update README.md (@RSeidelsohn)
- 28e6c8f Add table of contents to the README (@RSeidelsohn)
- 72778d8 Update README.md (@RSeidelsohn)
- a1d6b6a Update Readme.md (@RSeidelsohn)

### v3.1.0 (2022/02/03 11:01 +00:00)
- #32 Merge pull request #32 from RSeidelsohn/feature/0007_further-improvements (@RSeidelsohn)
- 7d04599 chore: Bump minor version (@RSeidelsohn)
- 6b3e9ba config: Improve module description text (@RSeidelsohn)
- c87725b docs: Update changes in README (@RSeidelsohn)
- 77dac66 docs: Add documentation for new 'limitAttributes' flag (@RSeidelsohn)
- b5bebdc test: Test new attributes filter functionality (@RSeidelsohn)
- 02f9d00 feat: Use new 'limitAttributes' flag (@RSeidelsohn)
- c02e181 feat: Add filterJson function to main program (@RSeidelsohn)
- 124ec3a feat: Add filterAttributes function for new limitAttributes flag (@RSeidelsohn)
- 2252e1e config: Decrease expected coverage percentages (@RSeidelsohn)
- ec15756 docs: Add "copyright" and order list alphabetically (@RSeidelsohn)
- ef2424d config: Add provisions for a future TS version of the project (@RSeidelsohn)
- ab1dbb2 style: Reorder variables (@RSeidelsohn)
- 44b674a docs: Add comment to function (@RSeidelsohn)

### v3.0.1 (2022/02/02 12:51 +00:00)
- #31 Merge pull request #31 from RSeidelsohn/feature/0006_fix-direct-option (@RSeidelsohn)
- f0f8642 chore: Bump fix version (@RSeidelsohn)
- 5b8c7e5 fix: Respect 'direct' option correctly (@RSeidelsohn)
- b4f1785 feat: Use new filter function (@RSeidelsohn)
- 33a8cb3 feat: Add new helper function for removing unwanted dependencies (@RSeidelsohn)
- 245f7a6 chore: Replace deprecated function (@RSeidelsohn)

### v3.0.0 (2022/02/01 19:19 +00:00)
- #30 Merge pull request #30 from RSeidelsohn/feature/0005_adjust-license-file-path (@RSeidelsohn)
- 559db1b doc: Document new feature (@RSeidelsohn)
- 97e4888 chore: Bump major version (@RSeidelsohn)
- 26333fe build: Add lodash.clonedeep module (@RSeidelsohn)
- 9cedc1e feat: Use licenseFile paths with --files option (@RSeidelsohn)
- #29 Merge pull request #29 from RSeidelsohn/features/0004_maintenance (@RSeidelsohn)
- a311bd2 Update README.md (@RSeidelsohn)

### v2.4.8 (2022/01/31 21:40 +00:00)
- 9ec6f30 chore: Bump version (@RSeidelsohn)
- 1671afb config: Add package-lock to repo (@RSeidelsohn)

### v2.4.7 (2022/01/31 21:35 +00:00)
- bd3e97a chore: Bump version (@RSeidelsohn)
- 3338a67 test: Update tests for npm install (@RSeidelsohn)
- 36f95ad chore: Delete obsolete yarn.lock (@RSeidelsohn)
- cd8765f build: Switch from yarn to npm (@RSeidelsohn)

### v2.4.6 (2022/01/31 21:20 +00:00)
- bc4dcb2 chore: Bump version (@RSeidelsohn)
- #28 Merge pull request #28 from RSeidelsohn/feature/0003_fix-tests (@RSeidelsohn)
- a77db58 test: Fix broken tests (@RSeidelsohn)

### v2.4.5 (2022/01/31 20:48 +00:00)
- 43715c8 chore: Bump version (@RSeidelsohn)

### v2.4.4 (2022/01/31 20:44 +00:00)
- a6e4935 build: Update lockfile (@RSeidelsohn)

### v2.4.3 (2022/01/31 20:11 +00:00)
- 1663bcb chore: Bump version (@RSeidelsohn)
- bd51f74 fix: Add missing comma (@RSeidelsohn)
- c0079b4 build: Increase node version (@RSeidelsohn)

### v2.4.2 (2022/01/31 16:52 +00:00)
- 6f66f8b chore: Bump version (@RSeidelsohn)
- afaf3a3 docs: Add new feature to docs (@RSeidelsohn)
- 90b30b2 chore: Bump version, update contributors (@RSeidelsohn)

### v2.4.1 (2022/01/31 16:03 +00:00)
- #22 Merge pull request #22 from Backfighter/patch-1 (@Backfighter)

### v2.4.0 (2022/01/31 15:59 +00:00)
- #26 Merge pull request #26 from d0b1010r/remove-console-log-failOn (@d0b1010r)

### v2.3.0 (2022/01/31 15:48 +00:00)
- #25 Merge pull request #25 from Semigradsky/master (@Semigradsky)
- 1c49b25 Remove console.log when failOn option is given (@d0b1010r)
- 27b301f Add `nopeer` option for ignoring peerDependencies. Add typings (@Semigradsky)
- ddba2d0 Indicate required node version (@Backfighter)
- b34fca8 Merge branch 'develop'

### v2.2.0 (2021/10/12 16:45 +00:00)
- cb91fb6 feat: Add support for detecting "unlicensed" modules
- 35d93b4 chore: Fix a typo and a missing comma
- 82abebf docs: Update contributors list

### v2.1.4 (2021/10/12 15:23 +00:00)
- 5f1b980 Merge branch 'develop'
- 08cc6ee chore: bump to next version number
- 2fce52d docs: Add info to README

### v2.1.3 (2021/10/11 19:12 +00:00)
- a43bbc0 Update dev-dependencies & fix duplicate entry in package.json
- e554f1a config: Update dependencies
- bdb9ca7 Update README.md (@RSeidelsohn)
- a0160cd Update dev-dependencies & fix duplicate entry in package.json
- 3acf3e2 config: Update dependencies
- 78ac387 Bump path-parse from 1.0.6 to 1.0.7 (@dependabot[bot])
- f5a3731 docs: Remove travis-ci build status as it fails for whatever reason
- 8a717fd config: Add license field to package.json
- fa3bfe2 config: Update lockfile and package.json
- dccc9c0 config: Update lockfile and package.json
- 840c82c config: Add license field to package.json
- 1fb7df9 Update npmpublish.yml (@RSeidelsohn)
- d37dc8e Update npmpublish.yml (@RSeidelsohn)

### v2.1.1 (2021/05/30 14:42 +00:00)
- ee23ecd config: Update fix version
- e20ebb1 fix: Update lockfile
- #13 Merge pull request #13 from mehmetb/mehmetb/fix-relative-module-path (@mehmetb)
- 58b9212 Merge branch 'master' into mehmetb/fix-relative-module-path (@RSeidelsohn)

### v2.1.0 (2021/05/30 14:29 +00:00)
- e3f6dcb Update minor version
- #12 Merge pull request #12 from mehmetb/mehmetb/fix-tests (@mehmetb)
- be9f80b Merge branch 'master' into mehmetb/fix-tests (@RSeidelsohn)

### v2.0.0 (2021/05/30 13:49 +00:00)
- e04b9b9 conf: Update major version
- e616329 fix: Fix broken stuff after refactoring and update failing tests
- cdd9c4c config: Remove babel-eslint
- 407bf06 style: Apply linter rules
- 0ed8a22 refactor: Rename a lib file
- 65dab1c refactor: Make a snippet more readable
- 5a3cb04 BREAKING CHANGE: Make unknown options exit license checker
- 9405cfb docs: Order options alphabetically and refactor some minor functions
- 4930f10 docs: Order command line options alphabetically and fix visual glitch
- e57d70e config: Adjust eslint rules
- b7a20a0 Updated contributors in package.json (@mehmetb)
- 60150a4 Fixed relative module paths option (@mehmetb)
- eff328f Updated contributors in package.json (@mehmetb)
- 9724ae9 Fixed a failing test (@mehmetb)
- ebb29c8 Allow --files and --out options to be used simultaneously (WIP)

### v1.2.2 (2021/05/02 14:28 +00:00)
- 7ddc92a Increase version
- 4b132b2 Remove debugging output
- 2e30514 Print warning for unknown options passed to license-checker
- 8a4000a Upgrade dependencies
- c29f7de Create new lockfile
- 06c5c4f New Version: Update dependencies
- 01c804e Fix index check and update tests
- f79e39c Update dependencies and increase version number
- #8 Merge pull request #8 from RSeidelsohn/feature/0002_create-plain-vertical-output (@RSeidelsohn)

### v1.2.0 (2021/04/08 16:55 +00:00)
- 7244dc0 Increase version number for new option (@RSeidelsohn)
- 0dfb384 Apply prettier formatting and use fixtures for new option test (@RSeidelsohn)
- c8aec83 Apply prettier formatting and use const rather than var (@RSeidelsohn)
- 305d5e5 Update documentation and add --angularCli synonym for --plainVertical (@RSeidelsohn)
- 91a903a Add version information to module names for --plainVertical (@RSeidelsohn)
- 4f2518a Apply prettier formatting (@RSeidelsohn)
- 1d01481 Create SECURITY.md (@RSeidelsohn)
- 8619690 WIP: Add new option 'plainVertical' (@RSeidelsohn)
- 3dc7f67 Apply prettier formatting rules (@RSeidelsohn)
- c65f153 Create codeql-analysis.yml (@RSeidelsohn)
- #6 Merge pull request #6 from RSeidelsohn/dependabot/npm_and_yarn/y18n-4.0.1 (@RSeidelsohn)
- #7 Merge pull request #7 from RSeidelsohn/develop (@RSeidelsohn)
- 26264bb Update tests and start refactoring (@RSeidelsohn)
- 25200da Upgrade dependencies to latest versions (@RSeidelsohn)
- b8cf489 Bump y18n from 4.0.0 to 4.0.1 (@dependabot[bot])
- e157e1c Add config files for prettier, nvm and git
- 5bcc48d Add PrettierJS as dev dependency
- 69e7b54 Update dependencies
- 5598611 Remove obsolete file
- ef0e391 Update node modules
- c277e69 Add link to the original release
- 3fe8111 Lower coverage affordances and fix tests
- #4 Merge pull request #4 from gugu/patch-1 (@gugu)
- f89cc19 Update license.js (@gugu)
- 0f0bc30 Support zero parity license for husky module (@gugu)
- #1 Merge pull request #1 from RSeidelsohn/dependabot/npm_and_yarn/acorn-7.1.1 (@RSeidelsohn)
- f10d5d7 Bump acorn from 7.1.0 to 7.1.1 (@dependabot[bot])

### v1.1.2 (2020/02/24 18:37 +00:00)
- b01f461 Update version
- 0edc410 Set up travis build process for the repository
- da4435a Update version number
- d4b5da6 Remove obsolete message
- e103c66 Update version
- dc9be2b Add new option `--relativeModulePath`
- fd31c6e Update the readme
- 1ebe5e5 Refactor code, implement new features and fix minor issues
