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
