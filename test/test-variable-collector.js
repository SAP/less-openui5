/* eslint-env mocha */
"use strict";

const assert = require("assert");
const VariableCollector = require("../lib/plugin/variable-collector");

describe("VariableCollector", function() {
	it("should return relevant variables when calling 'getVariables'", function() {
		const env = {};
		const variableCollector = new VariableCollector(env);

		variableCollector.mVariables = {
			"color1": {
				"value": "#ffffff",
				"filename": "my/ui/lib/themes/foo/global.less",
				"rootFilename": "my/other/ui/lib/themes/foo/library.source.less"
			},
			"_my_other_ui_lib_MyControl_color1": {
				"value": "#ffffff",
				"filename": "my/other/ui/lib/themes/foo/MyControl.less",
				"rootFilename": "my/other/ui/lib/themes/foo/library.source.less"
			},
			"_my_other_ui_lib_MyOtherControl_color1": {
				"value": "#ffffff",
				"filename": "my/other/ui/lib/themes/base/sub-directory/MyOtherControl.less",
				"rootFilename": "my/other/ui/lib/themes/foo/library.source.less"
			},
			"_my_other_ui_lib_MyControl_color2": {
				"value": "#008000",
				"filename": "my/other/ui/lib/themes/foo/MyControl.less",
				"rootFilename": "my/other/ui/lib/themes/foo/library.source.less"
			}
		};

		const aImports = [
			"my/ui/lib/themes/foo/global.less",
			"my/other/ui/lib/themes/foo/MyControl.less",
			"my/other/ui/lib/themes/base/library.source.less",
			"my/ui/lib/themes/base/global.less",
			"my/other/ui/lib/themes/base/MyControl.less",
			"my/other/ui/lib/themes/base/sub-directory/MyOtherControl.less"
		];

		const variables = variableCollector.getVariables(aImports);

		assert.deepEqual(variables, {
			"_my_other_ui_lib_MyControl_color1": "#ffffff",
			"_my_other_ui_lib_MyOtherControl_color1": "#ffffff",
			"_my_other_ui_lib_MyControl_color2": "#008000"
		}, "relevant variables should be returned");
	});
	it("should return relevant variables when calling 'getVariables' (win32 paths)", function() {
		const env = {};
		const variableCollector = new VariableCollector(env);

		variableCollector.mVariables = {
			"color1": {
				"value": "#ffffff",
				"filename": "my\\ui\\lib\\themes\\foo\\global.less",
				"rootFilename": "my\\other\\ui\\lib\\themes\\foo\\library.source.less"
			},
			"_my_other_ui_lib_MyControl_color1": {
				"value": "#ffffff",
				"filename": "my\\other\\ui\\lib\\themes\\foo\\MyControl.less",
				"rootFilename": "my\\other\\ui\\lib\\themes\\foo\\library.source.less"
			},
			"_my_other_ui_lib_MyOtherControl_color1": {
				"value": "#ffffff",
				"filename": "my\\other\\ui\\lib\\themes\\base\\sub-directory\\MyOtherControl.less",
				"rootFilename": "my\\other\\ui\\lib\\themes\\foo\\library.source.less"
			},
			"_my_other_ui_lib_MyControl_color2": {
				"value": "#008000",
				"filename": "my\\other\\ui\\lib\\themes\\foo\\MyControl.less",
				"rootFilename": "my\\other\\ui\\lib\\themes\\foo\\library.source.less"
			}
		};

		const aImports = [
			"my\\ui\\lib\\themes\\foo\\global.less",
			"my\\other\\ui\\lib\\themes\\foo\\MyControl.less",
			"my\\other\\ui\\lib\\themes\\base\\library.source.less",
			"my\\ui\\lib\\themes\\base\\global.less",
			"my\\other\\ui\\lib\\themes\\base\\MyControl.less",
			"my\\other\\ui\\lib\\themes\\base\\sub-directory\\MyOtherControl.less"
		];

		const variables = variableCollector.getVariables(aImports);

		assert.deepEqual(variables, {
			"_my_other_ui_lib_MyControl_color1": "#ffffff",
			"_my_other_ui_lib_MyOtherControl_color1": "#ffffff",
			"_my_other_ui_lib_MyControl_color2": "#008000"
		}, "relevant variables should be returned");
	});
	it("should return variables when calling 'getVariables' (filename = rootFilename, no imports)", function() {
		const env = {};
		const variableCollector = new VariableCollector(env);

		variableCollector.mVariables = {
			"color1": {
				"value": "#ffffff",
				"filename": "something",
				"rootFilename": "something"
			}
		};
		const aImports = [];

		const variables = variableCollector.getVariables(aImports);

		assert.deepEqual(variables, {
			"color1": "#ffffff"
		}, "relevant variables should be returned");
	});
});
