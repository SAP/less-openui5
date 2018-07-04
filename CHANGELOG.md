# 0.5.4 (2018-07-04)

### Fixes
- Revert "Fix inline theme parameters encoding for '#'" [#26](https://github.com/SAP/less-openui5/pull/26)

### All changes
[`0.5.3...0.5.4`](https://github.com/SAP/less-openui5/compare/0.5.3...0.5.4)


# 0.5.3 (2018-05-18)

### Fixes
- Fix less error propagation [#22](https://github.com/SAP/less-openui5/pull/22)
- Fix inline theme parameters encoding for '#' [#23](https://github.com/SAP/less-openui5/pull/23)

### All changes
[`0.5.2...0.5.3`](https://github.com/SAP/less-openui5/compare/0.5.2...0.5.3)


# 0.5.2 (2018-03-26)

### Fixes
- Fix reduced set of variables [#20](https://github.com/SAP/less-openui5/pull/20)

### All changes
[`0.5.1...0.5.2`](https://github.com/SAP/less-openui5/compare/0.5.1...0.5.2)


# 0.5.1 (2018-03-12)

### Fixes
- Changed paths in variable collector to posix variant [#19](https://github.com/SAP/less-openui5/pull/19)

### All changes
[`0.5.0...0.5.1`](https://github.com/SAP/less-openui5/compare/0.5.0...0.5.1)


# 0.5.0 (2018-02-09)

### Features
- Reduce collected variables to only add relevant ones [#18](https://github.com/SAP/less-openui5/pull/18)

### All changes
[`0.4.0...0.5.0`](https://github.com/SAP/less-openui5/compare/0.4.0...0.5.0)


# 0.4.0 (2017-12-13)

### Features
- Add scope option [#16](https://github.com/SAP/less-openui5/pull/16)
- Add custom fs option [#17](https://github.com/SAP/less-openui5/pull/17)

### All changes
[`0.3.1...0.4.0`](https://github.com/SAP/less-openui5/compare/0.3.1...0.4.0)


# 0.3.1 (2017-03-28)

### Fixes
- Performance workaround: Handle properties directly added to String proto [#12](https://github.com/SAP/less-openui5/pull/12)

### All changes
[`0.3.0...0.3.1`](https://github.com/SAP/less-openui5/compare/0.3.0...0.3.1)


# 0.3.0 (2017-03-23)

### Breaking changes
- Drop support for Node.js v0.10 [#5](https://github.com/SAP/less-openui5/pull/5)
- Replace static `build` function with `Builder` class to enable caching of build results [#10](https://github.com/SAP/less-openui5/pull/10)
- Refactor options to also include input LESS string [#6](https://github.com/SAP/less-openui5/pull/6)

### Features
- Added "lessInputPath" option to provide a path relative to the "rootPaths" [#10](https://github.com/SAP/less-openui5/pull/10)
- Added diffing and scoping to support Belize contrast areas [#10](https://github.com/SAP/less-openui5/pull/10)
- Analyze .theming files as theme scope indicators [#10](https://github.com/SAP/less-openui5/pull/10)

### All changes
[`0.2.0...0.3.0`](https://github.com/SAP/less-openui5/compare/0.2.0...0.3.0)


# 0.2.0 (2016-03-15)

### Breaking changes
- Set default of parser option `relativeUrls` to `true` [`00d892b`](https://github.com/SAP/less-openui5/commit/00d892b95c8c0401b8a61f1b1709dfc4a68cfa26)

### Features
- Include inline theming parameters [`4fa91b9`](https://github.com/SAP/less-openui5/commit/4fa91b997251f44ae3796e9f8396b45327005b13)

### All changes
[`0.1.3...0.2.0`](https://github.com/SAP/less-openui5/compare/0.1.3...0.2.0)
