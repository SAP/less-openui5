# Changelog
All notable changes to this project will be documented in this file.  
This project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

A list of unreleased changes can be found [here](https://github.com/SAP/less-openui5/compare/v0.8.6...HEAD).

<a name="v0.8.6"></a>
## [v0.8.6] - 2020-02-24
### Bug Fixes
- CSS var assignment only for less to less vars ([#116](https://github.com/SAP/less-openui5/issues/116)) [`2e9560d`](https://github.com/SAP/less-openui5/commit/2e9560dd2b89f7b1f3e09fcc3d0bfe867496a3fc)


<a name="v0.8.5"></a>
## [v0.8.5] - 2020-02-21
### Features
- Keep linking of less vars for css vars ([#115](https://github.com/SAP/less-openui5/issues/115)) [`3f99e9d`](https://github.com/SAP/less-openui5/commit/3f99e9d49fac620405dcad48556f5c4dfcf916c4)


<a name="v0.8.4"></a>
## [v0.8.4] - 2020-02-10
### Features
- Add experimental CSS variables and skeleton build ([#108](https://github.com/SAP/less-openui5/issues/108)) [`e6d8503`](https://github.com/SAP/less-openui5/commit/e6d85038f077ff252e8240d9924e7c4761ac4e5e)


<a name="v0.8.3"></a>
## [v0.8.3] - 2020-01-07
### Bug Fixes
- Diff algorithm exception ([#110](https://github.com/SAP/less-openui5/issues/110)) [`9628a6c`](https://github.com/SAP/less-openui5/commit/9628a6c6386b671e37a3c9680ca3b5fbd6175146)


<a name="v0.8.2"></a>
## [v0.8.2] - 2019-12-16
### Bug Fixes
- Support absolute import paths in less files ([#107](https://github.com/SAP/less-openui5/issues/107)) [`266b06d`](https://github.com/SAP/less-openui5/commit/266b06d9b091d34e6f279fbdf567702bcb9dbaed)


<a name="v0.8.1"></a>
## [v0.8.1] - 2019-12-03
### Bug Fixes
- Improve rule diffing algorithm ([#104](https://github.com/SAP/less-openui5/issues/104)) [`2527189`](https://github.com/SAP/less-openui5/commit/252718912861d2edde2041729a106fb3e0a6316b)


<a name="v0.8.0"></a>
## [v0.8.0] - 2019-11-18
### Breaking Changes
- Remove support for 'sourceMap' / 'cleancss' options [`3f234c8`](https://github.com/SAP/less-openui5/commit/3f234c88c4442035c0fe2683197c044ec6a93fab)

### Bug Fixes
- Apply less.js fix for import race condition [`694f6c4`](https://github.com/SAP/less-openui5/commit/694f6c41ad788eded034df6835cf5fbd8f6feaf3)


<a name="0.7.0"></a>
## [0.7.0] - 2019-10-30
### Breaking Changes
- Drop support for Node.js < 8.5 [`810962c`](https://github.com/SAP/less-openui5/commit/810962cf7bb4604641160d547593568f70b72f98)

### Bug Fixes
- Add inline parameters on empty CSS [`bc59d58`](https://github.com/SAP/less-openui5/commit/bc59d58486e972057675c5b8abe83229f116bc07)
- Scope rule handling ([#92](https://github.com/SAP/less-openui5/issues/92)) [`89b56c1`](https://github.com/SAP/less-openui5/commit/89b56c1a975f53ea8e436878b07707f1fb061486)


[v0.8.6]: https://github.com/SAP/less-openui5/compare/v0.8.5...v0.8.6
[v0.8.5]: https://github.com/SAP/less-openui5/compare/v0.8.4...v0.8.5
[v0.8.4]: https://github.com/SAP/less-openui5/compare/v0.8.3...v0.8.4
[v0.8.3]: https://github.com/SAP/less-openui5/compare/v0.8.2...v0.8.3
[v0.8.2]: https://github.com/SAP/less-openui5/compare/v0.8.1...v0.8.2
[v0.8.1]: https://github.com/SAP/less-openui5/compare/v0.8.0...v0.8.1
[v0.8.0]: https://github.com/SAP/less-openui5/compare/0.7.0...v0.8.0
[0.7.0]: https://github.com/SAP/less-openui5/compare/0.6.0...0.7.0
## 0.6.0 - 2018-09-10

### Breaking changes
- Drop unsupported Node.js versions. Now requires >= 6 [#45](https://github.com/SAP/less-openui5/pull/45)

### Fixes
- Again, fix inline theme parameters encoding for '#' [#48](https://github.com/SAP/less-openui5/pull/48)

### All changes
[`0.5.4...0.6.0`](https://github.com/SAP/less-openui5/compare/0.5.4...0.6.0)


## 0.5.4 - 2018-07-04

### Fixes
- Revert "Fix inline theme parameters encoding for '#'" [#26](https://github.com/SAP/less-openui5/pull/26)

### All changes
[`0.5.3...0.5.4`](https://github.com/SAP/less-openui5/compare/0.5.3...0.5.4)


## 0.5.3 - 2018-05-18

### Fixes
- Fix less error propagation [#22](https://github.com/SAP/less-openui5/pull/22)
- Fix inline theme parameters encoding for '#' [#23](https://github.com/SAP/less-openui5/pull/23)

### All changes
[`0.5.2...0.5.3`](https://github.com/SAP/less-openui5/compare/0.5.2...0.5.3)


## 0.5.2 - 2018-03-26

### Fixes
- Fix reduced set of variables [#20](https://github.com/SAP/less-openui5/pull/20)

### All changes
[`0.5.1...0.5.2`](https://github.com/SAP/less-openui5/compare/0.5.1...0.5.2)


## 0.5.1 - 2018-03-12

### Fixes
- Changed paths in variable collector to posix variant [#19](https://github.com/SAP/less-openui5/pull/19)

### All changes
[`0.5.0...0.5.1`](https://github.com/SAP/less-openui5/compare/0.5.0...0.5.1)


## 0.5.0 - 2018-02-09

### Features
- Reduce collected variables to only add relevant ones [#18](https://github.com/SAP/less-openui5/pull/18)

### All changes
[`0.4.0...0.5.0`](https://github.com/SAP/less-openui5/compare/0.4.0...0.5.0)


## 0.4.0 - 2017-12-13

### Features
- Add scope option [#16](https://github.com/SAP/less-openui5/pull/16)
- Add custom fs option [#17](https://github.com/SAP/less-openui5/pull/17)

### All changes
[`0.3.1...0.4.0`](https://github.com/SAP/less-openui5/compare/0.3.1...0.4.0)


## 0.3.1 - 2017-03-28

### Fixes
- Performance workaround: Handle properties directly added to String proto [#12](https://github.com/SAP/less-openui5/pull/12)

### All changes
[`0.3.0...0.3.1`](https://github.com/SAP/less-openui5/compare/0.3.0...0.3.1)


## 0.3.0 - 2017-03-23

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


## 0.2.0 - 2016-03-15

### Breaking changes
- Set default of parser option `relativeUrls` to `true` [`00d892b`](https://github.com/SAP/less-openui5/commit/00d892b95c8c0401b8a61f1b1709dfc4a68cfa26)

### Features
- Include inline theming parameters [`4fa91b9`](https://github.com/SAP/less-openui5/commit/4fa91b997251f44ae3796e9f8396b45327005b13)

### All changes
[`0.1.3...0.2.0`](https://github.com/SAP/less-openui5/compare/0.1.3...0.2.0)
