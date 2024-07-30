import jsdoc from "eslint-plugin-jsdoc";
import globals from "globals";
import path from "node:path";
import {fileURLToPath} from "node:url";
import js from "@eslint/js";
import {FlatCompat} from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

export default [
	{
		ignores: ["lib/thirdparty/"],
	},
	...compat.extends("eslint:recommended", "google"),
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
