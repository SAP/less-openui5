/* eslint-env mocha */
"use strict";

const assert = require("assert");
const path = require("path");

const createParser = require("../lib/less/parser");
function parseContent({parserOptions, fnFileHandler, content}) {
	return new Promise(function(resolve, reject) {
		const parser = createParser(parserOptions, fnFileHandler);
		parser.parse(content, function(err, tree) {
			if (err) {
				reject(err);
			} else {
				resolve(tree);
			}
		});
	});
}
function createFileHandler(files) {
	return function(file, currentFileInfo, handleDataAndCallCallback, callback) {
		let pathname;

		// support absolute paths such as "/resources/my/base.less"
		if (path.posix.isAbsolute(file)) {
			pathname = path.posix.normalize(file);
		} else {
			pathname = path.posix.join(currentFileInfo.currentDirectory, file);
		}

		if (files[pathname]) {
			handleDataAndCallCallback(pathname, files[pathname]);
		} else {
			callback({type: "File", message: "Could not find file at path '" + pathname + "'"});
		}
	};
}

// tested module
const CSSVariablesCollectorPlugin = require("../lib/plugin/css-variables-collector");

describe("CSSVariablesCollectorPlugin.getResolvedUrl", function() {
	it("should resolve relative url to ui5:// url (filename with /resources/ - UI5 Tooling)", function() {
		assert.strictEqual(
			CSSVariablesCollectorPlugin.getResolvedUrl({
				rawUrl: "img/foo.png",
				filename: "/resources/sap/ui/foo/themes/base/Foo.less",
				libraryName: "sap.ui.foo"
			}),
			"ui5://sap/ui/foo/themes/base/img/foo.png"
		);
	});
	it("should resolve relative url to ui5:// url (filename with / - grunt-openui5/connect-openui5)", function() {
		assert.strictEqual(
			CSSVariablesCollectorPlugin.getResolvedUrl({
				rawUrl: "img/foo.png",
				filename: "/sap/ui/foo/themes/base/Foo.less",
				libraryName: "sap.ui.foo"
			}),
			"ui5://sap/ui/foo/themes/base/img/foo.png"
		);
	});
	it("should resolve relative url to ui5:// url (filename absolute fs path - custom usage)", function() {
		assert.strictEqual(
			CSSVariablesCollectorPlugin.getResolvedUrl({
				rawUrl: "img/foo.png",
				filename: "/Users/root/sap/ui/foo/themes/base/Foo.less",
				libraryName: "sap.ui.foo"
			}),
			"ui5://sap/ui/foo/themes/base/img/foo.png"
		);
	});
	it("should return server-absolute url as-is", function() {
		assert.strictEqual(
			CSSVariablesCollectorPlugin.getResolvedUrl({
				rawUrl: "/assets/img/foo.png",
				filename: "/resources/sap/ui/foo/themes/base/Foo.less",
				libraryName: "sap.ui.foo"
			}),
			"/assets/img/foo.png"
		);
	});
	it("should return absolute http url as-is", function() {
		assert.strictEqual(
			CSSVariablesCollectorPlugin.getResolvedUrl({
				rawUrl: "http://example.com/assets/img/foo.png",
				filename: "/resources/sap/ui/foo/themes/base/Foo.less",
				libraryName: "sap.ui.foo"
			}),
			"http://example.com/assets/img/foo.png"
		);
	});
	it("Error: should return null when library namespace is not part of filename", function() {
		assert.strictEqual(
			CSSVariablesCollectorPlugin.getResolvedUrl({
				rawUrl: "img/foo.png",
				filename: "/resources/sap/ui/foo/themes/base/Foo.less",
				libraryName: "sap.ui.bar"
			}),
			null
		);
	});
	it("Error: should return null when libraryName is not given", function() {
		assert.strictEqual(
			CSSVariablesCollectorPlugin.getResolvedUrl({
				rawUrl: "img/foo.png",
				filename: "/resources/sap/ui/foo/themes/base/Foo.less",
				libraryName: undefined
			}),
			null
		);
	});
});

describe("CSSVariablesCollectorPlugin", function() {
	it("should collect variables and modify tree to produce skeleton CSS", async function() {
		const oCSSVariablesCollector = new CSSVariablesCollectorPlugin({
			libPath: "sap/ui/foo",
			libName: "sap.ui.foo",
			prefix: "_sap_ui_foo_"
		});
		const tree = await parseContent({
			content: `
			@myVar: red;
			.rule {
				color: @myVar;
				background-color: fade(@myVar, 50%)
			}
			`,
			parserOptions: {
				relativeUrls: true,
				filename: "sap/ui/foo/themes/base/library.source.less"
			}
		});

		const cssSkeleton = tree.toCSS({
			plugins: [oCSSVariablesCollector]
		});

		assert.strictEqual(cssSkeleton,
			`.rule {
  color: var(--myVar);
  background-color: var(--_sap_ui_foo_function_fade1);
}
`);

		const cssVariablesSource = oCSSVariablesCollector.toLessVariables({});
		assert.strictEqual(cssVariablesSource,
			`@myVar: #ff0000;
@_sap_ui_foo_function_fade1: fade(@myVar, 50%);

:root {
--myVar: @myVar;
--_sap_ui_foo_function_fade1: @_sap_ui_foo_function_fade1;
}
`);

		const cssVariablesOnly = oCSSVariablesCollector.getCssVariablesDeclaration();
		assert.strictEqual(cssVariablesOnly,
			`:root {
--myVar: @myVar;
}
`);
	});
	it("should provide proper relative URLs", async function() {
		const oCSSVariablesCollector = new CSSVariablesCollectorPlugin({
			libPath: "sap/ui/foo",
			libName: "sap.ui.foo",
			prefix: "_sap_ui_foo_"
		});
		const tree = await parseContent({
			content: `
			@import "../base/shared.less";
			.rule {
				background-image: @myUrl;
			}
			`,
			parserOptions: {
				relativeUrls: true,
				filename: "sap/ui/foo/themes/sap_fiori_3/library.source.less"
			},
			fnFileHandler: createFileHandler({
				"sap/ui/foo/themes/base/shared.less": `
					@myUrl: url(./fancy.png);
				`
			})
		});

		const cssSkeleton = tree.toCSS({
			plugins: [oCSSVariablesCollector]
		});

		assert.strictEqual(cssSkeleton,
			`.rule {
  background-image: var(--myUrl);
}
`);

		const cssVariablesSource = oCSSVariablesCollector.toLessVariables({
			myUrl: "url(../base/fancy.png)"
		});
		assert.strictEqual(cssVariablesSource,
			`@myUrl: url(../base/fancy.png);
@myUrl__asResolvedUrl: "ui5://sap/ui/foo/themes/base/fancy.png";

:root {
--myUrl: @myUrl;
--myUrl__asResolvedUrl: @myUrl__asResolvedUrl;
}
`);

		const cssVariablesOnly = oCSSVariablesCollector.getCssVariablesDeclaration();
		assert.strictEqual(cssVariablesOnly,
			`:root {
--myUrl: @myUrl;
--myUrl__asResolvedUrl: @myUrl__asResolvedUrl;
}
`);
	});
});
