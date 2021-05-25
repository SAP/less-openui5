/* eslint-env mocha */
"use strict";

const assert = require("assert");

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
