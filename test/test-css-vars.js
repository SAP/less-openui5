/* eslint-env mocha */
"use strict";

const assert = require("assert");
const readFile = require("./common/helper").readFile;

// tested module
const Builder = require("../").Builder;

describe("css vars", function() {
	it("should generate the correct css variables in a simple scenario", function() {
		return new Builder().build({
			lessInput: readFile("test/fixtures/simple/test.less"),
			cssVariables: true
		}).then(function(result) {
			assert.equal(result.css, readFile("test/expected/simple/test.css"), "css should be correctly generated.");
			assert.equal(result.cssSkeleton, readFile("test/expected/simple/test-cssvars-skeleton.css"),
				"skeleton css should be correctly generated.");
			assert.equal(result.cssVariables, readFile("test/expected/simple/test-cssvars-variables.css"),
				"css variables should be correctly generated.");
			assert.equal(result.cssVariablesSource, readFile("test/expected/simple/test-cssvars-variables.source.less"),
				"css variables source should be correctly generated.");
		});
	});

	it("should generate the correct css variables in a complex scenario", function() {
		return new Builder().build({
			lessInput: readFile("test/fixtures/complex/test.less"),
			cssVariables: true
		}).then(function(result) {
			assert.equal(result.css, readFile("test/expected/complex/test.css"), "css should be correctly generated.");
			assert.equal(result.cssSkeleton, readFile("test/expected/complex/test-cssvars-skeleton.css"),
				"skeleton css should be correctly generated.");
			assert.equal(result.cssVariables, readFile("test/expected/complex/test-cssvars-variables.css"),
				"css variables should be correctly generated.");
			assert.equal(result.cssVariablesSource,
				readFile("test/expected/complex/test-cssvars-variables.source.less"),
				"css variables source should be correctly generated.");
		});
	});
});

it("should generate the correct css variables for foo theme", function() {
	return new Builder().build({
		lessInputPath: "my/ui/lib/themes/foo/library.source.less",
		rootPaths: [
			"test/fixtures/libraries/lib1",
			"test/fixtures/libraries/lib2"
		],
		library: {
			name: "my.ui.lib"
		},
		cssVariables: true
	}).then(function(result) {
		const oVariablesExpected = {
			"default": {
				"color1": "#ffffff",
				"url1": "url('../base/111')",

			},
			"scopes": {
				"fooContrast": {
					"color1": "#000000"
				}
			}
		};

		assert.equal(result.css, readFile("test/expected/libraries/lib1/my/ui/lib/themes/foo/library.css"),
			"css should be correctly generated.");
		assert.equal(result.cssRtl, readFile("test/expected/libraries/lib1/my/ui/lib/themes/foo/library-RTL.css"),
			"rtl css should be correctly generated.");
		assert.deepEqual(result.variables, oVariablesExpected, "variables should be correctly collected.");
		assert.deepEqual(result.allVariables, oVariablesExpected, "allVariables should be correctly collected.");
		assert.equal(result.cssSkeleton, readFile("test/expected/libraries/lib1/my/ui/lib/themes/foo/library_skeleton.css"),
			"library_skeleton.css should be correctly generated.");
		assert.equal(result.cssSkeletonRtl, readFile("test/expected/libraries/lib1/my/ui/lib/themes/foo/library_skeleton-RTL.css"),
			"library_skeleton-RTL.css should be correctly generated.");
		assert.equal(result.cssVariables, readFile("test/expected/libraries/lib1/my/ui/lib/themes/foo/css_variables.css"),
			"css variables should be correctly generated.");
		assert.equal(result.cssVariablesSource, readFile("test/expected/libraries/lib1/my/ui/lib/themes/foo/css_variables.source.less"),
			"css variables source should be correctly generated.");
	});
});
