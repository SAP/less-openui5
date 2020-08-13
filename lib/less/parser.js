/* eslint-disable new-cap */
"use strict";

const less = require("../thirdparty/less");
const createFileLoader = require("./fileLoader");
const createImportsPushFunction = require("./importsPush");

function parserFactory(env, fileLoader) {
	// Make sure that provided "env" is an instance
	if (!(env instanceof less.tree.parseEnv)) {
		env = new less.tree.parseEnv(env);
	}

	const parser = new less.Parser(env);

	if (fileLoader) {
		patchParserImportsPush(parser, env, fileLoader);
	}

	return parser;
}

function patchParserImportsPush(parser, env, fileLoader) {
	// Hooks into the parser to be able to use custom file loader and use custom
	// parser factory for imports
	parser.imports.push = createImportsPushFunction(env, fileLoader, parserFactory);
}

module.exports = function createParser(env, fileHandler) {
	// Create fileLoader function if a fileHandler is provided
	let fileLoader;
	if (fileHandler) {
		fileLoader = createFileLoader(fileHandler);
	}

	return parserFactory(env, fileLoader);
};
