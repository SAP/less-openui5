/* eslint-env mocha */

const assert = require("assert");

// tested module
const themingParametersDataUri = require("../../../lib/themingParameters/dataUri");

describe("themingParameters/dataUri", function() {
	it("should not add theming parameters when library name is missing", function() {
		const result = {};
		const options = {};
		const returnedResult = themingParametersDataUri.addInlineParameters({result, options});

		assert.equal(returnedResult, result, "result object reference should be returned");
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
		const returnedResult = themingParametersDataUri.addInlineParameters({result, options});

		assert.equal(returnedResult, result, "result object reference should be returned");
		assert.deepEqual(result, {
			variables: {foo: "bar"},
			css: `/* css */
/* Inline theming parameters */
#sap-ui-theme-sap\\.ui\\.test{background-image:url('data:text/plain;utf-8,%7B%22foo%22%3A%22bar%22%7D')}
`
		}, "result.css should be enhanced");
	});

	it("should encode variables to be included as data-uri", function() {
		const result = {
			css: "/* css */",
			variables: {
				foo: "50%",
				bar: "'\"'"
			}
		};
		const options = {
			library: {
				name: "sap.ui.test"
			}
		};
		const returnedResult = themingParametersDataUri.addInlineParameters({result, options});

		assert.equal(returnedResult, result, "result object reference should be returned");
		assert.deepEqual(result, {
			variables: {
				foo: "50%",
				bar: "'\"'"
			},
			css: `/* css */
/* Inline theming parameters */
#sap-ui-theme-sap\\.ui\\.test{background-image:url('\
data:text/plain;utf-8,%7B%22foo%22%3A%2250%25%22%2C%22bar%22%3A%22%27%5C%22%27%22%7D')}
`
		}, "result.css should be enhanced");
	});

	it("should add theming parameters to cssRtl when options.rtl=true", function() {
		const result = {
			css: "/* css */",
			cssRtl: "/* cssRtl */",
			variables: {foo: "bar"}
		};
		const options = {
			library: {
				name: "sap.ui.test"
			},
			rtl: true
		};
		const returnedResult = themingParametersDataUri.addInlineParameters({result, options});

		assert.equal(returnedResult, result, "result object reference should be returned");
		assert.deepEqual(result, {
			variables: {foo: "bar"},
			css: `/* css */
/* Inline theming parameters */
#sap-ui-theme-sap\\.ui\\.test{background-image:url('data:text/plain;utf-8,%7B%22foo%22%3A%22bar%22%7D')}
`,
			cssRtl: `/* cssRtl */
/* Inline theming parameters */
#sap-ui-theme-sap\\.ui\\.test{background-image:url('data:text/plain;utf-8,%7B%22foo%22%3A%22bar%22%7D')}
`
		}, "result.css should be enhanced");
	});

	it("should add theming parameters to cssVariables when options.cssVariables=true", function() {
		const result = {
			css: "/* css */",
			cssVariables: "/* cssVariables */",
			variables: {foo: "bar"}
		};
		const options = {
			library: {
				name: "sap.ui.test"
			},
			cssVariables: true
		};
		const returnedResult = themingParametersDataUri.addInlineParameters({result, options});

		assert.equal(returnedResult, result, "result object reference should be returned");
		assert.deepEqual(result, {
			variables: {foo: "bar"},
			css: `/* css */
/* Inline theming parameters */
#sap-ui-theme-sap\\.ui\\.test{background-image:url('data:text/plain;utf-8,%7B%22foo%22%3A%22bar%22%7D')}
`,
			cssVariables: `/* cssVariables */
/* Inline theming parameters */
#sap-ui-theme-sap\\.ui\\.test{background-image:url('data:text/plain;utf-8,%7B%22foo%22%3A%22bar%22%7D')}
`
		}, "result.css should be enhanced");
	});

	it("should add theming parameters to cssRtl / cssVariables when options.rtl/cssVariables=true", function() {
		const result = {
			css: "/* css */",
			cssRtl: "/* cssRtl */",
			cssVariables: "/* cssVariables */",
			variables: {foo: "bar"}
		};
		const options = {
			library: {
				name: "sap.ui.test"
			},
			rtl: true,
			cssVariables: true
		};
		const returnedResult = themingParametersDataUri.addInlineParameters({result, options});

		assert.equal(returnedResult, result, "result object reference should be returned");
		assert.deepEqual(result, {
			variables: {foo: "bar"},
			css: `/* css */
/* Inline theming parameters */
#sap-ui-theme-sap\\.ui\\.test{background-image:url('data:text/plain;utf-8,%7B%22foo%22%3A%22bar%22%7D')}
`,
			cssRtl: `/* cssRtl */
/* Inline theming parameters */
#sap-ui-theme-sap\\.ui\\.test{background-image:url('data:text/plain;utf-8,%7B%22foo%22%3A%22bar%22%7D')}
`,
			cssVariables: `/* cssVariables */
/* Inline theming parameters */
#sap-ui-theme-sap\\.ui\\.test{background-image:url('data:text/plain;utf-8,%7B%22foo%22%3A%22bar%22%7D')}
`
		}, "result.css should be enhanced");
	});
});
