/* eslint-env mocha */

const assert = require("assert");
const sinon = require("sinon");
const mock = require("mock-require");

describe("themingParameters/cssVariables", function() {
	let themingParametersCssVariables;

	before(() => {
		mock("../../../lib/engine", {
			getInfo: sinon.stub().returns({
				name: "less-openui5",
				version: "1.0.0-test"
			})
		});
		themingParametersCssVariables = require("../../../lib/themingParameters/cssVariables");
	});
	after(() => {
		mock.stopAll();
	});

	it("should not add theming parameters when library name is missing", function() {
		const result = {};
		const options = {};
		const returnValue = themingParametersCssVariables.addInlineParameters({result, options});

		assert.equal(returnValue, undefined, "nothing should be returned");
		assert.deepEqual(result, {}, "result object should not be modified");
	});

	it("should add theming parameters to css", function() {
		const result = {
			css: "/* css */",
			variables: {foo: "bar"}
		};
		const options = {
			library: {
				name: "sap.ui.test"
			}
		};
		const expectedMetadata = {
			Path: `UI5.sap/ui/test.<theme-name>.library`, // TODO: theme name placeholder
			PathPattern: "/%frameworkId%/%libId%/themes/%themeId%/%fileId%.css",
			Extends: ["<base-theme>"], // TODO: base theme placeholder
			Scopes: [],
			Engine: {
				Version: "1.0.0-test",
				Name: "less-openui5"
			},
			Version: {
				Build: "<TODO>",
				Source: "<TODO>"
			}
		};

		const returnValue = themingParametersCssVariables.addInlineParameters({result, options});

		assert.equal(returnValue, undefined, "nothing should be returned");
		assert.deepEqual(result, {
			variables: {foo: "bar"},
			css: `/* css */
:root {
  --sapThemeMetaData-UI5-sap-ui-test: ${JSON.stringify(expectedMetadata)};
}

/* Inline theming parameters (CSS Variables) */
:root {
  --sapUiTheme-sap-ui-test: {};
  --foo: bar;
}
`
		}, "result.css should be enhanced");
	});
});
