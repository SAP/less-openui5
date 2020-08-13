/* eslint-env mocha */
"use strict";

const assert = require("assert");
const path = require("path");
const clone = require("clone");
const readFile = require("./common/helper").readFile;

// tested module
const Builder = require("../").Builder;

describe("options", function() {
	it("should return css, cssRtl, variables and imports with default options (lessInput)", function() {
		return new Builder().build({
			lessInput: readFile("test/fixtures/simple/test.less")
		}).then(function(result) {
			assert.equal(result.css, readFile("test/expected/simple/test.css"), "css should be correctly generated.");
			assert.equal(result.cssRtl, readFile("test/expected/simple/test-RTL.css"), "rtl css should be correctly generated.");
			assert.deepEqual(result.variables, JSON.parse(readFile("test/expected/simple/test-variables.json")), "variables should be correctly collected.");
			assert.deepEqual(result.imports, [], "import list should be empty.");
		});
	});

	it("should return css, cssRtl, variables and imports with default options (lessInputPath)", function() {
		return new Builder().build({
			lessInputPath: "test/fixtures/simple/test.less"
		}).then(function(result) {
			assert.equal(result.css, readFile("test/expected/simple/test.css"), "css should be correctly generated.");
			assert.equal(result.cssRtl, readFile("test/expected/simple/test-RTL.css"), "rtl css should be correctly generated.");
			assert.deepEqual(result.variables, JSON.parse(readFile("test/expected/simple/test-variables.json")), "variables should be correctly collected.");
			assert.deepEqual(result.imports, ["test/fixtures/simple/test.less"], "import list should be empty.");
		});
	});

	it("should not return cssRtl with option rtl set to false", function() {
		return new Builder().build({
			lessInput: readFile("test/fixtures/simple/test.less"),
			rtl: false
		}).then(function(result) {
			assert.equal(result.css, readFile("test/expected/simple/test.css"), "css should be correctly generated.");
			assert.strictEqual(result.cssRtl, undefined, "rtl css should not be generated.");
			assert.deepEqual(result.variables, JSON.parse(readFile("test/expected/simple/test-variables.json")), "variables should be correctly collected.");
		});
	});

	it("should return minified css and cssRtl with lessOption compress set to true", function() {
		return new Builder().build({
			lessInput: readFile("test/fixtures/simple/test.less"),
			compiler: {
				compress: true
			}
		}).then(function(result) {
			// remove the last LF to be able to compare the content correctly
			assert.equal(result.css, readFile("test/expected/simple/test.min.css", false), "css should be correctly generated.");
			assert.equal(result.cssRtl, readFile("test/expected/simple/test-RTL.min.css", false), "rtl css should be correctly generated.");
			assert.deepEqual(result.variables, JSON.parse(readFile("test/expected/simple/test-variables.min.json")), "variables should be correctly collected.");
			assert.deepEqual(result.imports, [], "import list should be empty.");
		});
	});

	it("should resolve import directives with rootPaths option", function() {
		return new Builder().build({
			lessInput: readFile("test/fixtures/rootPaths/lib2/my/themes/bar/bar.less"),
			rootPaths: [
				"test/fixtures/rootPaths/lib1",
				"test/fixtures/rootPaths/lib2"
			],
			parser: {
				filename: "my/themes/bar/bar.less"
			}
		}).then(function(result) {
			assert.equal(result.css, "", "css should be empty.");
			assert.deepEqual(result.variables, {}, "variables should be empty.");
			assert.deepEqual(result.imports, [
				path.join(
					"test", "fixtures", "rootPaths",
					"lib1", "my", "themes", "foo", "foo.less"
				)
			], "import list should not correctly filled.");
		});
	});

	it("should read input file with rootPaths option", function() {
		return new Builder().build({
			lessInputPath: "my/themes/bar/bar.less",
			rootPaths: [
				"test/fixtures/rootPaths/lib1",
				"test/fixtures/rootPaths/lib2"
			]
		}).then(function(result) {
			assert.equal(result.css, "", "css should be empty.");
			assert.deepEqual(result.variables, {}, "variables should be empty.");
			assert.deepEqual(result.imports, [
				path.join(
					"test", "fixtures", "rootPaths",
					"lib2", "my", "themes", "bar", "bar.less"
				),
				path.join(
					"test", "fixtures", "rootPaths",
					"lib1", "my", "themes", "foo", "foo.less"
				)
			], "import list should not correctly filled.");
		});
	});
});

describe("libraries (my/ui/lib)", function() {
	it("should create base theme", function() {
		return new Builder().build({
			lessInputPath: "my/ui/lib/themes/base/library.source.less",
			rootPaths: [
				"test/fixtures/libraries/lib1"
			],
			library: {
				name: "my.ui.lib"
			}
		}).then(function(result) {
			assert.equal(result.css, readFile("test/expected/libraries/lib1/my/ui/lib/themes/base/library.css"), "css should be correctly generated.");
			assert.equal(result.cssRtl, readFile("test/expected/libraries/lib1/my/ui/lib/themes/base/library-RTL.css"), "rtl css should be correctly generated.");
			assert.deepEqual(result.variables, {color1: "#fefefe"}, "variables should be correctly collected.");
			assert.deepEqual(result.allVariables, {color1: "#fefefe"}, "allVariables should be correctly collected.");
			assert.deepEqual(result.imports, [
				path.join("test", "fixtures", "libraries", "lib1", "my", "ui", "lib", "themes", "base", "library.source.less"),
				path.join("test", "fixtures", "libraries", "lib1", "my", "ui", "lib", "themes", "base", "global.less")
			], "import list should be correct.");
		});
	});

	it("should create foo theme with scope as defined in .theming file", function() {
		return new Builder().build({
			lessInputPath: "my/ui/lib/themes/foo/library.source.less",
			rootPaths: [
				"test/fixtures/libraries/lib1",
				"test/fixtures/libraries/lib2"
			],
			library: {
				name: "my.ui.lib"
			}
		}).then(function(result) {
			const oVariablesExpected = {
				"default": {
					"color1": "#ffffff",

				},
				"scopes": {
					"fooContrast": {
						"color1": "#000000"
					}
				}
			};

			assert.equal(result.css, readFile("test/expected/libraries/lib1/my/ui/lib/themes/foo/library.css"), "css should be correctly generated.");
			assert.equal(result.cssRtl, readFile("test/expected/libraries/lib1/my/ui/lib/themes/foo/library-RTL.css"), "rtl css should be correctly generated.");
			assert.deepEqual(result.variables, oVariablesExpected, "variables should be correctly collected.");
			assert.deepEqual(result.allVariables, oVariablesExpected, "allVariables should be correctly collected.");
			assert.deepEqual(result.imports, [
				path.join("test", "fixtures", "libraries", "lib1", "my", "ui", "lib", "themes", "foo", "library.source.less"),
				path.join("test", "fixtures", "libraries", "lib1", "my", "ui", "lib", "themes", "base", "library.source.less"),
				path.join("test", "fixtures", "libraries", "lib1", "my", "ui", "lib", "themes", "base", "global.less"),
				path.join("test", "fixtures", "libraries", "lib1", "my", "ui", "lib", "themes", "foo", "global.less"),
				path.join("test", "fixtures", "libraries", "lib2", "my", "ui", "lib", "themes", "bar", "library.source.less"),
				path.join("test", "fixtures", "libraries", "lib2", "my", "ui", "lib", "themes", "bar", "global.less"),
				path.join("test", "fixtures", "libraries", "lib1", "sap", "ui", "core", "themes", "foo", ".theming")
			], "import list should be correct.");
		});
	});

	it("should create bar theme with scope as defined in .theming file", function() {
		return new Builder().build({
			lessInputPath: "my/ui/lib/themes/bar/library.source.less",
			rootPaths: [
				"test/fixtures/libraries/lib1",
				"test/fixtures/libraries/lib2"
			],
			library: {
				name: "my.ui.lib"
			}
		}).then(function(result) {
			const oVariablesExpected = {
				"default": {
					"color1": "#ffffff",
				},
				"scopes": {
					"barContrast": {
						"color1": "#000000"
					}
				}
			};

			assert.equal(result.css, readFile("test/expected/libraries/lib2/my/ui/lib/themes/bar/library.css"), "css should be correctly generated.");
			assert.equal(result.cssRtl, readFile("test/expected/libraries/lib2/my/ui/lib/themes/bar/library-RTL.css"), "rtl css should be correctly generated.");
			assert.deepEqual(result.variables, oVariablesExpected, "variables should be correctly collected.");
			assert.deepEqual(result.allVariables, oVariablesExpected, "allVariables should be correctly collected.");
			assert.deepEqual(result.imports, [
				path.join("test", "fixtures", "libraries", "lib2", "my", "ui", "lib", "themes", "bar", "library.source.less"),
				path.join("test", "fixtures", "libraries", "lib1", "my", "ui", "lib", "themes", "foo", "library.source.less"),
				path.join("test", "fixtures", "libraries", "lib1", "my", "ui", "lib", "themes", "base", "library.source.less"),
				path.join("test", "fixtures", "libraries", "lib1", "my", "ui", "lib", "themes", "base", "global.less"),
				path.join("test", "fixtures", "libraries", "lib1", "my", "ui", "lib", "themes", "foo", "global.less"),
				path.join("test", "fixtures", "libraries", "lib2", "my", "ui", "lib", "themes", "bar", "global.less"),
				path.join("test", "fixtures", "libraries", "lib2", "sap", "ui", "core", "themes", "bar", ".theming")
			], "import list should be correct.");
		});
	});

	it("should create correct files on empty less input", function() {
		return new Builder().build({
			lessInputPath: "empty.less",
			rootPaths: [
				"test/fixtures/libraries/empty"
			],
			library: {
				name: "my.empty.lib"
			}
		}).then(function(result) {
			const oVariablesExpected = {};

			assert.equal(result.css, readFile("test/expected/libraries/empty/library.css"), "css should be correctly generated.");
			assert.equal(result.cssRtl, readFile("test/expected/libraries/empty/library-RTL.css"), "rtl css should be correctly generated.");
			assert.deepEqual(result.variables, oVariablesExpected, "variables should be correctly collected.");
			assert.deepEqual(result.allVariables, oVariablesExpected, "allVariables should be correctly collected.");
			assert.deepEqual(result.imports, [
				path.join("test", "fixtures", "libraries", "empty", "empty.less"),
			], "import list should be correct.");
		});
	});
});

describe("libraries (my/other/ui/lib)", function() {
	it("should create base theme", function() {
		return new Builder().build({
			lessInputPath: "my/other/ui/lib/themes/base/library.source.less",
			rootPaths: [
				"test/fixtures/libraries/lib1",
				"test/fixtures/libraries/lib3"
			],
			library: {
				name: "my.other.ui.lib"
			}
		}).then(function(result) {
			assert.equal(result.css, readFile("test/expected/libraries/lib3/my/other/ui/lib/themes/base/library.css"), "css should be correctly generated.");
			assert.equal(result.cssRtl, readFile("test/expected/libraries/lib3/my/other/ui/lib/themes/base/library-RTL.css"), "rtl css should be correctly generated.");
			assert.deepEqual(result.variables, {"_my_other_ui_lib_MyControl_color1": "#fefefe"}, "variables should be correctly collected.");
			assert.deepEqual(result.allVariables, {
				"_my_other_ui_lib_MyControl_color1": "#fefefe",
				"color1": "#fefefe"
			}, "allVariables should be correctly collected.");
			assert.deepEqual(result.imports, [
				path.join("test", "fixtures", "libraries", "lib3", "my", "other", "ui", "lib", "themes", "base", "library.source.less"),
				path.join("test", "fixtures", "libraries", "lib1", "my", "ui", "lib", "themes", "base", "global.less"),
				path.join("test", "fixtures", "libraries", "lib3", "my", "other", "ui", "lib", "themes", "base", "MyControl.less")
			], "import list should be correct.");
		});
	});

	it("should create foo theme with scope as defined in .theming file", function() {
		return new Builder().build({
			lessInputPath: "my/other/ui/lib/themes/foo/library.source.less",
			rootPaths: [
				"test/fixtures/libraries/lib1",
				"test/fixtures/libraries/lib2",
				"test/fixtures/libraries/lib3"
			],
			library: {
				name: "my.other.ui.lib"
			}
		}).then(function(result) {
			const oVariablesExpected = {
				"default": {
					"_my_other_ui_lib_MyControl_color1": "#ffffff",
					"_my_other_ui_lib_MyControl_color2": "#008000"
				},
				"scopes": {
					"fooContrast": {
						"_my_other_ui_lib_MyControl_color1": "#000000"
					}
				}
			};
			const oAllVariablesExpected = {
				"default": {
					"_my_other_ui_lib_MyControl_color1": "#ffffff",
					"_my_other_ui_lib_MyControl_color2": "#008000",
					"color1": "#ffffff"
				},
				"scopes": {
					"fooContrast": {
						"_my_other_ui_lib_MyControl_color1": "#000000",
						"color1": "#000000"
					}
				}
			};

			assert.deepEqual(result.variables, oVariablesExpected, "variables should be correctly collected.");
			assert.deepEqual(result.allVariables, oAllVariablesExpected, "allVariables should be correctly collected.");
			assert.equal(result.css, readFile("test/expected/libraries/lib3/my/other/ui/lib/themes/foo/library.css"), "css should be correctly generated.");
			assert.equal(result.cssRtl, readFile("test/expected/libraries/lib3/my/other/ui/lib/themes/foo/library-RTL.css"), "rtl css should be correctly generated.");
			assert.deepEqual(result.imports, [
				path.join("test", "fixtures", "libraries", "lib3", "my", "other", "ui", "lib", "themes", "foo", "library.source.less"),
				path.join("test", "fixtures", "libraries", "lib3", "my", "other", "ui", "lib", "themes", "base", "library.source.less"),
				path.join("test", "fixtures", "libraries", "lib1", "my", "ui", "lib", "themes", "base", "global.less"),
				path.join("test", "fixtures", "libraries", "lib3", "my", "other", "ui", "lib", "themes", "base", "MyControl.less"),
				path.join("test", "fixtures", "libraries", "lib1", "my", "ui", "lib", "themes", "foo", "global.less"),
				path.join("test", "fixtures", "libraries", "lib3", "my", "other", "ui", "lib", "themes", "foo", "MyControl.less"),
				path.join("test", "fixtures", "libraries", "lib3", "my", "other", "ui", "lib", "themes", "bar", "library.source.less"),
				path.join("test", "fixtures", "libraries", "lib2", "my", "ui", "lib", "themes", "bar", "global.less"),
				path.join("test", "fixtures", "libraries", "lib1", "sap", "ui", "core", "themes", "foo", ".theming")
			], "import list should be correct.");
		});
	});

	it("should create bar theme with scope as defined in .theming file", function() {
		return new Builder().build({
			lessInputPath: "my/other/ui/lib/themes/bar/library.source.less",
			rootPaths: [
				"test/fixtures/libraries/lib1",
				"test/fixtures/libraries/lib2",
				"test/fixtures/libraries/lib3"
			],
			library: {
				name: "my.other.ui.lib"
			}
		}).then(function(result) {
			const oVariablesExpected = {
				"default": {
					"_my_other_ui_lib_MyControl_color1": "#ffffff",
					"_my_other_ui_lib_MyControl_color2": "#008000"
				},
				"scopes": {
					"barContrast": {
						"_my_other_ui_lib_MyControl_color1": "#000000"
					}
				}
			};
			const oAllVariablesExpected = {
				"default": {
					"_my_other_ui_lib_MyControl_color1": "#ffffff",
					"_my_other_ui_lib_MyControl_color2": "#008000",
					"color1": "#ffffff"
				},
				"scopes": {
					"barContrast": {
						"_my_other_ui_lib_MyControl_color1": "#000000",
						"color1": "#000000"
					}
				}
			};

			assert.deepEqual(result.variables, oVariablesExpected, "variables should be correctly collected.");
			assert.deepEqual(result.allVariables, oAllVariablesExpected, "allVariables should be correctly collected.");
			assert.equal(result.css, readFile("test/expected/libraries/lib3/my/other/ui/lib/themes/bar/library.css"), "css should be correctly generated.");
			assert.equal(result.cssRtl, readFile("test/expected/libraries/lib3/my/other/ui/lib/themes/bar/library-RTL.css"), "rtl css should be correctly generated.");
			assert.deepEqual(result.imports, [
				path.join("test", "fixtures", "libraries", "lib3", "my", "other", "ui", "lib", "themes", "bar", "library.source.less"),
				path.join("test", "fixtures", "libraries", "lib3", "my", "other", "ui", "lib", "themes", "foo", "library.source.less"),
				path.join("test", "fixtures", "libraries", "lib3", "my", "other", "ui", "lib", "themes", "base", "library.source.less"),
				path.join("test", "fixtures", "libraries", "lib1", "my", "ui", "lib", "themes", "base", "global.less"),
				path.join("test", "fixtures", "libraries", "lib3", "my", "other", "ui", "lib", "themes", "base", "MyControl.less"),
				path.join("test", "fixtures", "libraries", "lib1", "my", "ui", "lib", "themes", "foo", "global.less"),
				path.join("test", "fixtures", "libraries", "lib3", "my", "other", "ui", "lib", "themes", "foo", "MyControl.less"),
				path.join("test", "fixtures", "libraries", "lib2", "my", "ui", "lib", "themes", "bar", "global.less"),
				path.join("test", "fixtures", "libraries", "lib2", "sap", "ui", "core", "themes", "bar", ".theming")
			], "import list should be correct.");
		});
	});
});

describe("error handling", function() {
	it("should have correct error in case of undefined variable usage (lessInput)", function() {
		return new Builder().build({
			lessInput: readFile("test/fixtures/error/undefined-var.less")
		}).then(function(result) {
			// no resolve
			assert.ok(false);
		}, function(err) {
			assert.ok(err);
		});
	});

	it("should have correct error in case of undefined variable usage (lessInputPath)", function() {
		return new Builder().build({
			lessInputPath: "main.less",
			rootPaths: ["test/fixtures/error"]
		}).then(function(result) {
			// no resolve
			assert.ok(false);
		}, function(err) {
			assert.ok(err);
		});
	});

	it("should throw error when using 'cleancss' option (not supported)", function() {
		return new Builder().build({
			lessInputPath: "main.less",
			rootPaths: ["test/fixtures/error"],
			compiler: {
				cleancss: true
			}
		}).then(function() {
			// no resolve
			assert.ok(false);
		}, function(err) {
			assert.equal(err.message, "compiler.cleancss option is not supported! Please use 'clean-css' directly.");
			assert.ok(err);
		});
	});

	it("should throw error when using 'sourceMap' option (not supported)", function() {
		return new Builder().build({
			lessInputPath: "main.less",
			rootPaths: ["test/fixtures/error"],
			compiler: {
				sourceMap: true
			}
		}).then(function() {
			// no resolve
			assert.ok(false);
		}, function(err) {
			assert.equal(err.message, "compiler.sourceMap option is not supported!");
			assert.ok(err);
		});
	});
});

function assertLessToRtlCssEqual(filename) {
	const lessFilename = "test/fixtures/rtl/" + filename + ".less";
	const cssFilename = "test/expected/rtl/" + filename + ".css";

	return new Builder().build({
		lessInput: readFile(lessFilename),
		parser: {
			filename: filename + ".less",
			paths: "test/fixtures/rtl"
		}
	}).then(function(result) {
		assert.equal(result.cssRtl, readFile(cssFilename), "rtl css should not be generated.");
	});
}

describe("rtl", function() {
	it("background-position", function() {
		return assertLessToRtlCssEqual("background-position");
	});

	it("background", function() {
		return assertLessToRtlCssEqual("background");
	});

	it("border", function() {
		return assertLessToRtlCssEqual("border");
	});

	it("cursor", function() {
		return assertLessToRtlCssEqual("cursor");
	});

	it("gradient", function() {
		return assertLessToRtlCssEqual("gradient");
	});

	it("image-url", function() {
		return assertLessToRtlCssEqual("image-url");
	});

	it("misc", function() {
		return assertLessToRtlCssEqual("misc");
	});

	it("shadow", function() {
		return assertLessToRtlCssEqual("shadow");
	});

	it("transform", function() {
		return assertLessToRtlCssEqual("transform");
	});

	it("variables", function() {
		return assertLessToRtlCssEqual("variables");
	});
});

describe("variables", function() {
	it("should return only globally defined variables", function() {
		return new Builder().build({
			lessInput: readFile("test/fixtures/variables/main.less")
		}).then(function(result) {
			assert.equal(result.css, readFile("test/expected/variables/main.css"), "css should be correctly generated.");
			assert.deepEqual(result.variables, JSON.parse(readFile("test/expected/variables/variables.json")), "variables should be correctly collected.");
			assert.deepEqual(result.imports, [], "import list should be empty.");
		});
	});
});

describe("imports", function() {
	it("should return imported file paths", function() {
		return new Builder().build({
			lessInput: readFile("test/fixtures/imports/main.less"),
			parser: {
				filename: "main.less",
				paths: ["test/fixtures/imports"]
			}
		}).then(function(result) {
			assert.equal(result.css, readFile("test/expected/imports/main.css"), "css should be correctly generated.");
			assert.deepEqual(result.variables, {}, "variables should be empty.");
			assert.deepEqual(result.imports, [
				path.join("test", "fixtures", "imports", "dir1", "foo.less"),
				path.join("test", "fixtures", "imports", "dir2", "bar.less"),
				path.join("test", "fixtures", "imports", "dir3", "inline.css")
			], "import list should be correctly filled.");
		});
	});

	it("should use \"relativeUrls\" parser option by default", function() {
		return new Builder().build({
			lessInput: readFile("test/fixtures/imports/main.less"),
			parser: {
				filename: "main.less",
				paths: ["test/fixtures/imports"]
			}
		}).then(function(result) {
			assert.equal(result.css, readFile("test/expected/imports/main.css"), "css should be correctly generated.");
		});
	});

	it("should not rewrite urls when \"relativeUrls\" parser option is set to \"false\"", function() {
		return new Builder().build({
			lessInput: readFile("test/fixtures/imports/main.less"),
			parser: {
				filename: "main.less",
				paths: ["test/fixtures/imports"],
				relativeUrls: false
			}
		}).then(function(result) {
			assert.equal(result.css, readFile("test/expected/imports/main-no-relativeUrls.css"), "css should be correctly generated.");
		});
	});
});

describe("inline theming parameters", function() {
	it("should not include inline parameters when no library name is given", function() {
		return new Builder().build({
			lessInput: readFile("test/fixtures/simple/test.less")
		}).then(function(result) {
			assert.ok(!/#sap-ui-theme-/.test(result.css), "inline parameter rule should not be present.");
			assert.ok(!/data:text\/plain/.test(result.css), "data-uri should not be present.");

			assert.equal(result.css, readFile("test/expected/simple/test.css"), "css should be correctly generated.");
		});
	});

	it("should include inline parameters when library name is given", function() {
		return new Builder().build({
			lessInput: readFile("test/fixtures/simple/test.less"),
			library: {
				name: "foo.bar"
			}
		}).then(function(result) {
			assert.ok(/#sap-ui-theme-foo\\.bar/.test(result.css), "inline parameter rule for library should be present.");
			assert.ok(/data:text\/plain/.test(result.css), "data-uri should be present.");

			assert.equal(result.css, readFile("test/expected/simple/test-inline-parameters.css"), "css should be correctly generated.");
		});
	});
});

describe("theme caching", function() {
	it("should cache the theme", function() {
		const lessOptions = {
			lessInputPath: "my/ui/lib/themes/bar/library.source.less",
			rootPaths: [
				"test/fixtures/libraries/lib1",
				"test/fixtures/libraries/lib2"
			],
			library: {
				name: "my.ui.lib"
			}
		};

		const builder = new Builder();

		return builder.build(lessOptions).then(function(res) {
			const cacheFirstRun = clone(builder.themeCacheMapping);

			assert.notDeepEqual(cacheFirstRun, {}, "themeCache should not be empty.");

			// second run
			return builder.build(lessOptions).then(function(result) {
				const cacheSecondRun = clone(builder.themeCacheMapping);

				assert.deepEqual(res, result, "callback result should be the same");

				assert.notDeepEqual(cacheSecondRun, {}, "themeCache should not be empty.");

				assert.deepEqual(cacheFirstRun, cacheSecondRun, "cache should be equal after second build run.");
			});
		});
	});

	it("should recompile the theme after clearing the cache", function() {
		const lessOptions = {
			lessInputPath: "my/ui/lib/themes/bar/library.source.less",
			rootPaths: [
				"test/fixtures/libraries/lib1",
				"test/fixtures/libraries/lib2"
			],
			library: {
				name: "my.ui.lib"
			}
		};

		const builder = new Builder();

		return builder.build(lessOptions).then(function(res) {
			const cacheFirstRun = clone(builder.themeCacheMapping);

			assert.notDeepEqual(cacheFirstRun, {}, "themeCache should not be empty.");

			builder.clearCache();

			assert.deepEqual(builder.themeCacheMapping, {}, "themeCache should be empty.");

			// second run
			return builder.build(lessOptions).then(function(result) {
				const cacheSecondRun = clone(builder.themeCacheMapping);

				assert.equal(JSON.stringify(res, null, 4), JSON.stringify(result, null, 4), "callback result should be the same");

				assert.notDeepEqual(cacheSecondRun, {}, "themeCache should not be empty.");
			});
		});
	});
});

describe("CSS Scoping (via .theming file) of", function() {
	describe("comments", function() {
		it("should return same CSS for foo", function() {
			return new Builder().build({
				lessInputPath: "comments/themes/foo/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/comments/lib1",
					"test/fixtures/libraries/scopes/comments/lib2",
					"test/fixtures/libraries/lib1"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/comments/lib1/comments/themes/foo/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/comments/lib1/comments/themes/foo/library-RTL.css"), "Rtl CSS scoping should be correctly generated");
			});
		});

		it("should return same CSS for bar", function() {
			return new Builder().build({
				lessInputPath: "comments/themes/bar/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/comments/lib1",
					"test/fixtures/libraries/scopes/comments/lib2",
					"test/fixtures/libraries/lib1",
					"test/fixtures/libraries/lib2"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/comments/lib2/comments/themes/bar/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/comments/lib2/comments/themes/bar/library-RTL.css"), "Rtl CSS scoping should be correctly generated");
			});
		});
	});

	describe("css-scope-root", function() {
		it("should return same CSS for foo", function() {
			return new Builder().build({
				lessInputPath: "css-scope-root/themes/foo/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/css-scope-root/lib1",
					"test/fixtures/libraries/scopes/css-scope-root/lib2",
					"test/fixtures/libraries/lib1"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/css-scope-root/lib1/css-scope-root/themes/foo/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/css-scope-root/lib1/css-scope-root/themes/foo/library-RTL.css"), "CSS scoping should be correctly generated");
			});
		});

		it("should return same CSS for bar", function() {
			return new Builder().build({
				lessInputPath: "css-scope-root/themes/bar/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/css-scope-root/lib1",
					"test/fixtures/libraries/scopes/css-scope-root/lib2",
					"test/fixtures/libraries/lib1",
					"test/fixtures/libraries/lib2"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/css-scope-root/lib2/css-scope-root/themes/bar/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/css-scope-root/lib2/css-scope-root/themes/bar/library-RTL.css"), "Rtl CSS scoping should be correctly generated");
			});
		});
	});

	describe("default", function() {
		it("should return same CSS for foo", function() {
			return new Builder().build({
				lessInputPath: "default/themes/foo/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/default/lib1",
					"test/fixtures/libraries/scopes/default/lib2",
					"test/fixtures/libraries/lib1"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/default/lib1/default/themes/foo/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/default/lib1/default/themes/foo/library-RTL.css"), "Rtl CSS scoping should be correctly generated");
			});
		});

		it("should return same CSS for bar", function() {
			return new Builder().build({
				lessInputPath: "default/themes/bar/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/default/lib1",
					"test/fixtures/libraries/scopes/default/lib2",
					"test/fixtures/libraries/lib1",
					"test/fixtures/libraries/lib2"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/default/lib2/default/themes/bar/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/default/lib2/default/themes/bar/library-RTL.css"), "Rtl CSS scoping should be correctly generated");
			});
		});
	});


	describe("dom", function() {
		it("should return same CSS for foo", function() {
			return new Builder().build({
				lessInputPath: "dom/themes/foo/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/dom/lib1",
					"test/fixtures/libraries/scopes/dom/lib2",
					"test/fixtures/libraries/lib1"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/dom/lib1/dom/themes/foo/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/dom/lib1/dom/themes/foo/library-RTL.css"), "CSS scoping should be correctly generated");
			});
		});

		it("should return same CSS for bar", function() {
			return new Builder().build({
				lessInputPath: "dom/themes/bar/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/dom/lib1",
					"test/fixtures/libraries/scopes/dom/lib2",
					"test/fixtures/libraries/lib1",
					"test/fixtures/libraries/lib2"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/dom/lib2/dom/themes/bar/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/dom/lib2/dom/themes/bar/library-RTL.css"), "CSS scoping should be correctly generated");
			});
		});
	});

	describe("empty media queries", function() {
		it("should return same CSS for foo", function() {
			return new Builder().build({
				lessInputPath: "empty-media-queries/themes/foo/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/empty-media-queries/lib1",
					"test/fixtures/libraries/scopes/empty-media-queries/lib2",
					"test/fixtures/libraries/lib1"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/empty-media-queries/lib1/empty-media-queries/themes/foo/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/empty-media-queries/lib1/empty-media-queries/themes/foo/library-RTL.css"), "CSS scoping should be correctly generated");
			});
		});

		it("should return same CSS for bar", function() {
			return new Builder().build({
				lessInputPath: "empty-media-queries/themes/bar/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/empty-media-queries/lib1",
					"test/fixtures/libraries/scopes/empty-media-queries/lib2",
					"test/fixtures/libraries/lib1",
					"test/fixtures/libraries/lib2"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/empty-media-queries/lib2/empty-media-queries/themes/bar/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/empty-media-queries/lib2/empty-media-queries/themes/bar/library-RTL.css"), "CSS scoping should be correctly generated");
			});
		});
	});

	describe("HTML", function() {
		it("should return same CSS for foo", function() {
			return new Builder().build({
				lessInputPath: "html/themes/foo/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/html/lib1",
					"test/fixtures/libraries/scopes/html/lib2",
					"test/fixtures/libraries/lib1"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/html/lib1/html/themes/foo/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/html/lib1/html/themes/foo/library.css"), "CSS scoping should be correctly generated");
			});
		});

		it("should return same CSS for bar", function() {
			return new Builder().build({
				lessInputPath: "html/themes/bar/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/html/lib1",
					"test/fixtures/libraries/scopes/html/lib2",
					"test/fixtures/libraries/lib1",
					"test/fixtures/libraries/lib2"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/html/lib2/html/themes/bar/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/html/lib2/html/themes/bar/library-RTL.css"), "CSS scoping should be correctly generated");
			});
		});
	});


	describe("media-queries", function() {
		it("should return same CSS for foo", function() {
			return new Builder().build({
				lessInputPath: "media-queries/themes/foo/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/media-queries/lib1",
					"test/fixtures/libraries/scopes/media-queries/lib2",
					"test/fixtures/libraries/lib1"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/media-queries/lib1/media-queries/themes/foo/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/media-queries/lib1/media-queries/themes/foo/library-RTL.css"), "CSS scoping should be correctly generated");
			});
		});

		it("should return same CSS for bar", function() {
			return new Builder().build({
				lessInputPath: "media-queries/themes/bar/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/media-queries/lib1",
					"test/fixtures/libraries/scopes/media-queries/lib2",
					"test/fixtures/libraries/lib1",
					"test/fixtures/libraries/lib2"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/media-queries/lib2/media-queries/themes/bar/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/media-queries/lib2/media-queries/themes/bar/library-RTL.css"), "CSS scoping should be correctly generated");
			});
		});
	});

	describe("mixins", function() {
		it("should return same CSS for foo", function() {
			return new Builder().build({
				lessInputPath: "mixins/themes/foo/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/mixins/lib1",
					"test/fixtures/libraries/scopes/mixins/lib2",
					"test/fixtures/libraries/lib1"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/mixins/lib1/mixins/themes/foo/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/mixins/lib1/mixins/themes/foo/library-RTL.css"), "CSS scoping should be correctly generated");
			});
		});

		it("should return same CSS for bar", function() {
			return new Builder().build({
				lessInputPath: "mixins/themes/bar/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/mixins/lib1",
					"test/fixtures/libraries/scopes/mixins/lib2",
					"test/fixtures/libraries/lib1",
					"test/fixtures/libraries/lib2"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/mixins/lib2/mixins/themes/bar/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/mixins/lib2/mixins/themes/bar/library-RTL.css"), "CSS scoping should be correctly generated");
			});
		});
	});

	describe("multiple imports", function() {
		it("should return same CSS for foo", function() {
			return new Builder().build({
				lessInputPath: "multiple-imports/themes/foo/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/multiple-imports/lib1",
					"test/fixtures/libraries/scopes/multiple-imports/lib2",
					"test/fixtures/libraries/lib1"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/multiple-imports/lib1/multiple-imports/themes/foo/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/multiple-imports/lib1/multiple-imports/themes/foo/library-RTL.css"), "CSS scoping should be correctly generated");
			});
		});

		it("should return same CSS for bar", function() {
			return new Builder().build({
				lessInputPath: "multiple-imports/themes/bar/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/multiple-imports/lib1",
					"test/fixtures/libraries/scopes/multiple-imports/lib2",
					"test/fixtures/libraries/lib1",
					"test/fixtures/libraries/lib2"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/multiple-imports/lib2/multiple-imports/themes/bar/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/multiple-imports/lib2/multiple-imports/themes/bar/library-RTL.css"), "CSS scoping should be correctly generated");
			});
		});
	});
});

describe("CSS Scoping (via option) of", function() {
	describe("comments", function() {
		it("should return same CSS for foo", function() {
			return new Builder().build({
				scope: {
					selector: "fooContrast",
					embeddedFilePath: "comments/themes/bar/library.source.less",
					embeddedCompareFilePath: "comments/themes/foo/library.source.less",
					baseFilePath: "comments/themes/foo/library.source.less"
				},
				lessInputPath: "comments/themes/foo/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/comments/lib1",
					"test/fixtures/libraries/scopes/comments/lib2"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/comments/lib1/comments/themes/foo/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/comments/lib1/comments/themes/foo/library-RTL.css"), "Rtl CSS scoping should be correctly generated");
			});
		});

		it("should return same CSS for bar", function() {
			return new Builder().build({
				scope: {
					selector: "barContrast",
					embeddedFilePath: "comments/themes/bar/library.source.less",
					embeddedCompareFilePath: "comments/themes/foo/library.source.less",
					baseFilePath: "comments/themes/foo/library.source.less"
				},
				lessInputPath: "comments/themes/bar/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/comments/lib1",
					"test/fixtures/libraries/scopes/comments/lib2"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/comments/lib2/comments/themes/bar/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/comments/lib2/comments/themes/bar/library-RTL.css"), "Rtl CSS scoping should be correctly generated");
			});
		});
	});

	describe("css-scope-root", function() {
		it("should return same CSS for foo", function() {
			return new Builder().build({
				scope: {
					selector: "fooContrast",
					embeddedFilePath: "css-scope-root/themes/bar/library.source.less",
					embeddedCompareFilePath: "css-scope-root/themes/foo/library.source.less",
					baseFilePath: "css-scope-root/themes/foo/library.source.less"
				},
				lessInputPath: "css-scope-root/themes/foo/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/css-scope-root/lib1",
					"test/fixtures/libraries/scopes/css-scope-root/lib2"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/css-scope-root/lib1/css-scope-root/themes/foo/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/css-scope-root/lib1/css-scope-root/themes/foo/library-RTL.css"), "CSS scoping should be correctly generated");
			});
		});

		it("should return same CSS for bar", function() {
			return new Builder().build({
				scope: {
					selector: "barContrast",
					embeddedFilePath: "css-scope-root/themes/bar/library.source.less",
					embeddedCompareFilePath: "css-scope-root/themes/foo/library.source.less",
					baseFilePath: "css-scope-root/themes/foo/library.source.less"
				},
				lessInputPath: "css-scope-root/themes/bar/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/css-scope-root/lib1",
					"test/fixtures/libraries/scopes/css-scope-root/lib2"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/css-scope-root/lib2/css-scope-root/themes/bar/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/css-scope-root/lib2/css-scope-root/themes/bar/library-RTL.css"), "Rtl CSS scoping should be correctly generated");
			});
		});
	});

	describe("default", function() {
		it("should return same CSS for foo", function() {
			return new Builder().build({
				scope: {
					selector: "fooContrast",
					embeddedFilePath: "default/themes/bar/library.source.less",
					embeddedCompareFilePath: "default/themes/foo/library.source.less",
					baseFilePath: "default/themes/foo/library.source.less"
				},
				lessInputPath: "default/themes/foo/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/default/lib1",
					"test/fixtures/libraries/scopes/default/lib2"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/default/lib1/default/themes/foo/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/default/lib1/default/themes/foo/library-RTL.css"), "Rtl CSS scoping should be correctly generated");
			});
		});

		it("should return same CSS for bar", function() {
			return new Builder().build({
				scope: {
					selector: "barContrast",
					embeddedFilePath: "default/themes/bar/library.source.less",
					embeddedCompareFilePath: "default/themes/foo/library.source.less",
					baseFilePath: "default/themes/foo/library.source.less"
				},
				lessInputPath: "default/themes/bar/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/default/lib1",
					"test/fixtures/libraries/scopes/default/lib2"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/default/lib2/default/themes/bar/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/default/lib2/default/themes/bar/library-RTL.css"), "Rtl CSS scoping should be correctly generated");
			});
		});
	});


	describe("dom", function() {
		it("should return same CSS for foo", function() {
			return new Builder().build({
				scope: {
					selector: "fooContrast",
					embeddedFilePath: "dom/themes/bar/library.source.less",
					embeddedCompareFilePath: "dom/themes/foo/library.source.less",
					baseFilePath: "dom/themes/foo/library.source.less"
				},
				lessInputPath: "dom/themes/foo/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/dom/lib1",
					"test/fixtures/libraries/scopes/dom/lib2"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/dom/lib1/dom/themes/foo/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/dom/lib1/dom/themes/foo/library-RTL.css"), "CSS scoping should be correctly generated");
			});
		});

		it("should return same CSS for bar", function() {
			return new Builder().build({
				scope: {
					selector: "barContrast",
					embeddedFilePath: "dom/themes/bar/library.source.less",
					embeddedCompareFilePath: "dom/themes/foo/library.source.less",
					baseFilePath: "dom/themes/foo/library.source.less"
				},
				lessInputPath: "dom/themes/bar/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/dom/lib1",
					"test/fixtures/libraries/scopes/dom/lib2"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/dom/lib2/dom/themes/bar/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/dom/lib2/dom/themes/bar/library-RTL.css"), "CSS scoping should be correctly generated");
			});
		});
	});

	describe("empty media queries", function() {
		it("should return same CSS for foo", function() {
			return new Builder().build({
				scope: {
					selector: "fooContrast",
					embeddedFilePath: "empty-media-queries/themes/bar/library.source.less",
					embeddedCompareFilePath: "empty-media-queries/themes/foo/library.source.less",
					baseFilePath: "empty-media-queries/themes/foo/library.source.less"
				},
				lessInputPath: "empty-media-queries/themes/foo/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/empty-media-queries/lib1",
					"test/fixtures/libraries/scopes/empty-media-queries/lib2"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/empty-media-queries/lib1/empty-media-queries/themes/foo/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/empty-media-queries/lib1/empty-media-queries/themes/foo/library-RTL.css"), "CSS scoping should be correctly generated");
			});
		});

		it("should return same CSS for bar", function() {
			return new Builder().build({
				scope: {
					selector: "barContrast",
					embeddedFilePath: "empty-media-queries/themes/bar/library.source.less",
					embeddedCompareFilePath: "empty-media-queries/themes/foo/library.source.less",
					baseFilePath: "empty-media-queries/themes/foo/library.source.less"
				},
				lessInputPath: "empty-media-queries/themes/bar/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/empty-media-queries/lib1",
					"test/fixtures/libraries/scopes/empty-media-queries/lib2"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/empty-media-queries/lib2/empty-media-queries/themes/bar/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/empty-media-queries/lib2/empty-media-queries/themes/bar/library-RTL.css"), "CSS scoping should be correctly generated");
			});
		});
	});

	describe("HTML", function() {
		it("should return same CSS for foo", function() {
			return new Builder().build({
				scope: {
					selector: "fooContrast",
					embeddedFilePath: "html/themes/bar/library.source.less",
					embeddedCompareFilePath: "html/themes/foo/library.source.less",
					baseFilePath: "html/themes/foo/library.source.less"
				},
				lessInputPath: "html/themes/foo/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/html/lib1",
					"test/fixtures/libraries/scopes/html/lib2"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/html/lib1/html/themes/foo/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/html/lib1/html/themes/foo/library.css"), "CSS scoping should be correctly generated");
			});
		});

		it("should return same CSS for bar", function() {
			return new Builder().build({
				scope: {
					selector: "barContrast",
					embeddedFilePath: "html/themes/bar/library.source.less",
					embeddedCompareFilePath: "html/themes/foo/library.source.less",
					baseFilePath: "html/themes/foo/library.source.less"
				},
				lessInputPath: "html/themes/bar/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/html/lib1",
					"test/fixtures/libraries/scopes/html/lib2"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/html/lib2/html/themes/bar/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/html/lib2/html/themes/bar/library-RTL.css"), "CSS scoping should be correctly generated");
			});
		});
	});


	describe("media-queries", function() {
		it("should return same CSS for foo", function() {
			return new Builder().build({
				scope: {
					selector: "fooContrast",
					embeddedFilePath: "media-queries/themes/bar/library.source.less",
					embeddedCompareFilePath: "media-queries/themes/foo/library.source.less",
					baseFilePath: "media-queries/themes/foo/library.source.less"
				},
				lessInputPath: "media-queries/themes/foo/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/media-queries/lib1",
					"test/fixtures/libraries/scopes/media-queries/lib2"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/media-queries/lib1/media-queries/themes/foo/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/media-queries/lib1/media-queries/themes/foo/library-RTL.css"), "CSS scoping should be correctly generated");
			});
		});

		it("should return same CSS for bar", function() {
			return new Builder().build({
				scope: {
					selector: "barContrast",
					embeddedFilePath: "media-queries/themes/bar/library.source.less",
					embeddedCompareFilePath: "media-queries/themes/foo/library.source.less",
					baseFilePath: "media-queries/themes/foo/library.source.less"
				},
				lessInputPath: "media-queries/themes/bar/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/media-queries/lib1",
					"test/fixtures/libraries/scopes/media-queries/lib2"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/media-queries/lib2/media-queries/themes/bar/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/media-queries/lib2/media-queries/themes/bar/library-RTL.css"), "CSS scoping should be correctly generated");
			});
		});
	});

	describe("mixins", function() {
		it("should return same CSS for foo", function() {
			return new Builder().build({
				scope: {
					selector: "fooContrast",
					embeddedFilePath: "mixins/themes/bar/library.source.less",
					embeddedCompareFilePath: "mixins/themes/foo/library.source.less",
					baseFilePath: "mixins/themes/foo/library.source.less"
				},
				lessInputPath: "mixins/themes/foo/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/mixins/lib1",
					"test/fixtures/libraries/scopes/mixins/lib2"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/mixins/lib1/mixins/themes/foo/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/mixins/lib1/mixins/themes/foo/library-RTL.css"), "CSS scoping should be correctly generated");
			});
		});

		it("should return same CSS for bar", function() {
			return new Builder().build({
				scope: {
					selector: "barContrast",
					embeddedFilePath: "mixins/themes/bar/library.source.less",
					embeddedCompareFilePath: "mixins/themes/foo/library.source.less",
					baseFilePath: "mixins/themes/foo/library.source.less"
				},
				lessInputPath: "mixins/themes/bar/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/mixins/lib1",
					"test/fixtures/libraries/scopes/mixins/lib2"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/mixins/lib2/mixins/themes/bar/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/mixins/lib2/mixins/themes/bar/library-RTL.css"), "CSS scoping should be correctly generated");
			});
		});
	});

	describe("multiple imports", function() {
		it("should return same CSS for foo", function() {
			return new Builder().build({
				scope: {
					selector: "fooContrast",
					embeddedFilePath: "multiple-imports/themes/bar/library.source.less",
					embeddedCompareFilePath: "multiple-imports/themes/foo/library.source.less",
					baseFilePath: "multiple-imports/themes/foo/library.source.less"
				},
				lessInputPath: "multiple-imports/themes/foo/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/multiple-imports/lib1",
					"test/fixtures/libraries/scopes/multiple-imports/lib2"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/multiple-imports/lib1/multiple-imports/themes/foo/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/multiple-imports/lib1/multiple-imports/themes/foo/library-RTL.css"), "CSS scoping should be correctly generated");
			});
		});

		it("should return same CSS for bar", function() {
			return new Builder().build({
				scope: {
					selector: "barContrast",
					embeddedFilePath: "multiple-imports/themes/bar/library.source.less",
					embeddedCompareFilePath: "multiple-imports/themes/foo/library.source.less",
					baseFilePath: "multiple-imports/themes/foo/library.source.less"
				},
				lessInputPath: "multiple-imports/themes/bar/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/multiple-imports/lib1",
					"test/fixtures/libraries/scopes/multiple-imports/lib2"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/multiple-imports/lib2/multiple-imports/themes/bar/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/multiple-imports/lib2/multiple-imports/themes/bar/library-RTL.css"), "CSS scoping should be correctly generated");
			});
		});

		// unit test for https://github.com/less/less.js/issues/1898
		it("should create the same css content independent from nesting consistently 50x", function() {
			const aPromises = [];
			const oBuilder = new Builder();
			const expectedLibraryCssContent = readFile("test/expected/libraries/lib4/my/ui/lib/themes/cascading/library.css");
			const expectedLibraryCssRtlContent = readFile("test/expected/libraries/lib4/my/ui/lib/themes/cascading/library-RTL.css");
			for (let i = 0; i < 50; i++) {
				const oPromise = oBuilder.build({
					lessInputPath: "my/ui/lib/themes/cascading/library.source.less",
					rootPaths: [
						"test/fixtures/libraries/lib4"
					]
				}).then(function(result) {
					assert.equal(result.css, expectedLibraryCssContent, "CSS scoping should be correctly generated");
					assert.equal(result.cssRtl, expectedLibraryCssRtlContent, "CSS scoping should be correctly generated");
				});
				aPromises.push(oPromise);
			}
			return Promise.all(aPromises);
		});

		it("diff testing with comments in between", function() {
			const expectedLibraryCssContent = readFile("test/expected/libraries/lib5/my/ui/lib/themes/cascading/library.css");
			const expectedLibraryCssRtlContent = readFile("test/expected/libraries/lib5/my/ui/lib/themes/cascading/library-RTL.css");
			return new Builder().build({
				lessInputPath: "my/ui/lib/themes/cascading/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/lib5"
				],
				scope: {
					selector: "sapContrastPlus",
					embeddedFilePath: "my/ui/lib/themes/cascading/plus/library.source.less",
					embeddedCompareFilePath: "my/ui/lib/themes/cascading/base/library.source.less",
					baseFilePath: "."
				}
			}).then(function(result) {
				assert.equal(result.css, expectedLibraryCssContent, "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, expectedLibraryCssRtlContent, "RTL CSS scoping should be correctly generated");
			});
		});
	});

	describe("Error handling", function() {
		it("should throw error when embeddedFile is missing", function() {
			return new Builder().build({
				scope: {
					selector: "fooContrast",
					embeddedFilePath: "comments/themes/bar/library.source.less",
					embeddedCompareFilePath: "comments/themes/foo/library.source.less",
					baseFilePath: "comments/themes/foo/library.source.less"
				},
				lessInputPath: "comments/themes/foo/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/comments/lib1"
				]
			}).then(function() {
				assert.fail("Build should not succeed");
			}, function(err) {
				assert.ok(err instanceof Error, "err should be instance of Error");
				assert.equal(err.message, "Could not find embeddedFile at path 'comments/themes/bar/library.source.less'");
			});
		});
		it("should throw error when embeddedCompareFile is missing", function() {
			return new Builder().build({
				scope: {
					selector: "fooContrast",
					embeddedFilePath: "comments/themes/bar/library.source.less",
					embeddedCompareFilePath: "comments/themes/foo/library.source.less",
					baseFilePath: "comments/themes/foo/library.source.less"
				},
				lessInputPath: "comments/themes/bar/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/comments/lib2"
				]
			}).then(function() {
				assert.fail("Build should not succeed");
			}, function(err) {
				assert.ok(err instanceof Error, "err should be instance of Error");
				assert.equal(err.message, "Could not find embeddedCompareFile at path 'comments/themes/foo/library.source.less'");
			});
		});
	});
});
