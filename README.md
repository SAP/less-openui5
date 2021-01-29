![OpenUI5](http://openui5.org/images/OpenUI5_new_big_side.png)

[![REUSE status](https://api.reuse.software/badge/github.com/SAP/less-openui5)](https://api.reuse.software/info/github.com/SAP/less-openui5)
[![Build Status](http://img.shields.io/travis/SAP/less-openui5.svg?style=flat)](https://travis-ci.org/SAP/less-openui5)
[![NPM Version](http://img.shields.io/npm/v/less-openui5.svg?style=flat)](https://www.npmjs.org/package/less-openui5)

# less-openui5

> Build OpenUI5 themes with [Less.js](http://lesscss.org).

## Install

```
npm install less-openui5
```

## Usage

```js
var lessOpenUI5 = require('less-openui5');

// Create a builder instance
var builder = new lessOpenUI5.Builder();

// Build a theme
builder.build({
  lessInput: '@var: #ffffff; .class { color: @var; float: left }'
})
.then(function(result) {

  console.log(result.css); // => regular css
  /*
  .class {
   color: #ffffff;
   float: left;
  }
  */

  console.log(result.cssRtl); // => mirrored css for right-to-left support
  /*
  .class {
    color: #ffffff;
    float: right;
  }
  */

  console.log(result.variables); // => less variables with their values (only global ones)
  /*
  { var: "#ffffff" }
  */

  console.log(result.imports); // => paths to files imported via @import directives
  /*
  []
  */

  // Clear builder cache when finished to cleanup memory
  builder.clearCache();

});
```

## API

### new Builder([options])

Creates a new `Builder` instance.

It caches build results to only rebuild a theme when related files have been changed.  
This is mainly relevant when building themes as part of a server middleware like [`connect-openui5`](https://github.com/SAP/connect-openui5).

#### options

##### fs
Type: [Node.js `fs` interface](https://nodejs.org/api/fs.html)

By default, all file system access is done via the standard Node.js file system ("fs"). With this option an alternative file system can be passed and will be used for all file system operations.

### .build(options)
Returns a Promise resolving with a [`result`](#result) object.

#### options

##### lessInput

*Required (either `lessInput` or `lessInputPath`, not both)*  
Type: `string`

Input less content.

##### lessInputPath

*Required (either `lessInput` or `lessInputPath`, not both)*  
Type: `string`

Path to input less file.  
When `rootPaths` is given this must be a relative path inside one of the provided `rootPaths`, otherwise just a regular filesystem path.

##### rtl

Type: `boolean`  
Default: `true`

Create mirrored css for right-to-left support.

##### cssVariables

Type `boolean`  
Default: `false`

Create files for experimental CSS Variables support ([`cssSkeleton`](#cssSkeleton), [`cssSkeletonRtl`](#cssSkeletonRtl), [`cssVariablesSource`](#cssVariablesSource), [`cssVariables`](#cssVariables-1)).

##### rootPaths

Type: `array` of `string`

Root paths to use for import directives.

This option differs from the less `compiler.paths` option.  
It is useful if less files are located in separate folders but referenced as they would all be in one.  

###### Example

```js
rootPaths: [ './lib1', './lib2' ]
```

Folder structure

```
lib1
 my
  themes
   foo
    foo.less
lib2
 my
  themes
   bar
    bar.less
```
`lib2/my/themes/bar/bar.less`
```css
@import "../foo/foo.less"; /* lib1/my/themes/foo/foo.less will be imported */
```

##### parser

Type: `object`

Options for the [less](http://lesscss.org) parser (`less.Parser`).  

**Note**
- Default of `relativeUrls` option is changed from `false` to `true`.
- Option `javascriptEnabled` has been removed. JavaScript is always disabled and cannot be enabled.

##### compiler

Type `object`

Options for the [less](http://lesscss.org) compiler (`tree.toCss`).

**Note:** The options `sourceMap` and `cleancss` are not supported. An exception will be thrown when used.

##### library.name

Type `string`

Dot-separated name of the corresponding library.  
It will be used to inline the `variables` JSON as data-uri which can be retrieved at runtime.

##### scope

Type `object`

Scope options to be set when not using a .theming file. The available settings are:
* `selector`
* `embeddedFilePath`
* `embeddedCompareFilePath`
* `baseFilePath`

Those settings correspond to the aScopes property of the .theming file. When using this options all four settings have to be set.

Example:
```js
scope: {
  selector: "scopeSelector",
  embeddedFilePath: "src/themes/theme_to_be_embedded.less",
  embeddedCompareFilePath: "src/themes/basetheme_to_compare_embedded_theme_to.less",
  baseFilePath: "src/themes/basetheme_to_compare_embedded_theme_to.less"
}
```

#### result

##### css

Type: `string`

Regular css output.

##### cssRtl

Type: `string`

Mirrored css for right-to-left support (if rtl option was enabled).

##### variables

Type: `object`

Key-value map of global less variables (without @ prefix) defined by files within the same folder as the input file. This excludes variables imported from a different path, as those are usually shared across multiple themes.

##### allVariables

Type: `object`

Key-value map of all global less variables (without @ prefix).

##### imports

Type: `array`

Paths to files imported via import directives.

##### cssSkeleton

Type: `string`  
Only available when [`options.cssVariables`](#cssVariables) is set to `true`

CSS with references to CSS Variables.

##### cssSkeletonRtl

Type: `string`  
Only available when [`options.cssVariables`](#cssVariables) and [`options.rtl`](#rtl) are set to `true`

Mirrored (right-to-left) CSS with references to CSS Variables (if `rtl` option was enabled).

##### cssVariablesSource

Type: `string`  
Only available when [`options.cssVariables`](#cssVariables) is set to `true`

Source file used to compile the `cssVariables` output.

##### cssVariables

Type: `string`  
Only available when [`options.cssVariables`](#cssVariables) is set to `true`

Definition of CSS Variables based on LESS variables.

### .clearCache()
Clears all cached build results.  
Use this method to prevent high memory consumption when building many themes within the same process.

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md).

## Release History

See [CHANGELOG.md](CHANGELOG.md).
