import jsdoc from "eslint-plugin-jsdoc";
import globals from "globals";
import js from "@eslint/js";
import google from "eslint-config-google";


export default [
	js.configs.recommended,
	google,
	{
		ignores: ["lib/thirdparty/"],
	},
	{
		plugins: {
			jsdoc,
		},

		languageOptions: {
			globals: {
				...globals.node,
				...globals.mocha,
			},

			ecmaVersion: 8,
			sourceType: "commonjs",
		},

		settings: {
			jsdoc: {
				tagNamePreference: {
					return: "returns",
				},
			},
		},

		rules: {
			"indent": ["error", "tab"],
			"linebreak-style": ["error", "unix"],

			"quotes": [
				"error",
				"double",
				{
					allowTemplateLiterals: true,
				},
			],

			"semi": ["error", "always"],
			"no-negated-condition": "off",
			"require-jsdoc": "off",
			"no-mixed-requires": "off",

			"max-len": [
				"warn", // TODO: set to "error" and fix all findings
				{
					code: 120,
					ignoreUrls: true,
					ignoreRegExpLiterals: true,
				},
			],

			"no-implicit-coercion": [
				2,
				{
					allow: ["!!"],
				},
			],

			"comma-dangle": "off",
			"no-tabs": "off",
			// This rule must be disabled as of ESLint 9. It's removed and causes issues when present.
			// https://eslint.org/docs/latest/rules/valid-jsdoc
			"valid-jsdoc": 0,
			"jsdoc/require-param-description": 0,
			"jsdoc/require-returns-description": 0,
			"jsdoc/require-returns": 0,
		},
	},
	{
		files: ["**/*.mjs"],

		languageOptions: {
			ecmaVersion: 2022,
			sourceType: "module",
		},
	},
];
