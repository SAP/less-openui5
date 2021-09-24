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
	it("should return relevant variables when calling 'getVariables' (special case: sap.ui.core Base/baseLib/)",
		function() {
			const env = {};
			const variableCollector = new VariableCollector(env);

			variableCollector.mVariables = {
				"baseColor1": {
					"value": "#fffff0",
					"filename": "sap/ui/core/theming/Base/baseLib/base/base.less",
					"rootFilename": "sap/ui/core/themes/foo/library.source.less"
				},
				"baseColor2": {
					"value": "#fffff1",
					"filename": "sap/ui/core/theming/Base/baseLib/foo/base.less",
					"rootFilename": "sap/ui/core/themes/foo/library.source.less"
				},
				"coreColor1": {
					"value": "#fffff2",
					"filename": "sap/ui/core/themes/base/global.less",
					"rootFilename": "sap/ui/core/themes/foo/library.source.less"
				},
				"coreColor2": {
					"value": "#fffff3",
					"filename": "sap/ui/core/themes/foo/global.less",
					"rootFilename": "sap/ui/core/themes/foo/library.source.less"
				}
			};

			const aImports = [
				"sap/ui/core/themes/base/global.less",
				"sap/ui/core/themes/base/library.source.less",
				"sap/ui/core/themes/foo/global.less",
				"sap/ui/core/themes/foo/library.source.less",
				"sap/ui/core/theming/Base/baseLib/base/base.less",
				"sap/ui/core/theming/Base/baseLib/foo/base.less"
			];

			const variables = variableCollector.getVariables(aImports);

			assert.deepEqual(variables, {
				"baseColor1": "#fffff0",
				"baseColor2": "#fffff1",
				"coreColor1": "#fffff2",
				"coreColor2": "#fffff3",
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
