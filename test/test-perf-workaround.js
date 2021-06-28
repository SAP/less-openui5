/* eslint-env mocha */
"use strict";

const assert = require("assert");
const path = require("path");
const readFile = require("./common/helper").readFile;

// tested module
const Builder = require("../").Builder;

describe("performance workaround", function() {
	it("should run with patched String prototype", function() {
		function customGetter() {
			return "customGetter";
		}
		String.prototype.__defineGetter__("customGetter", customGetter);

		function customProp() {
			return "customProp";
		}
		// eslint-disable-next-line no-extend-native
		String.prototype.customProp = customProp;

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
					"url1": "url('../base/111')",
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
			assert.deepEqual(result.imports, [
				path.join("test", "fixtures", "libraries", "lib1", "my", "ui", "lib", "themes", "foo", "library.source.less"),
				path.join("test", "fixtures", "libraries", "lib1", "my", "ui", "lib", "themes", "base", "library.source.less"),
				path.join("test", "fixtures", "libraries", "lib1", "my", "ui", "lib", "themes", "base", "global.less"),
				path.join("test", "fixtures", "libraries", "lib1", "my", "ui", "lib", "themes", "foo", "global.less"),
				path.join("test", "fixtures", "libraries", "lib2", "my", "ui", "lib", "themes", "bar", "library.source.less"),
				path.join("test", "fixtures", "libraries", "lib2", "my", "ui", "lib", "themes", "bar", "global.less"),
				path.join("test", "fixtures", "libraries", "lib1", "sap", "ui", "core", "themes", "foo", ".theming")
			], "import list should be correct.");

			assert.strictEqual(String.prototype.__lookupGetter__("customGetter"), customGetter, "Custom getter should again be set on String prototype.");
			assert.strictEqual(String.prototype.customProp, customProp, "Custom property should again be set on String prototype.");
		});
	});
});
