/*
 * This file contains a modified version of the local function "imports.push" within the constructor of "less.Parser"
 * from /lib/thirdparty/less/parser.js (L70-L111)
 * Modifications are marked with comments in the code.
 */

/* eslint-disable consistent-this, new-cap, no-invalid-this */
"use strict";

const less = require("../thirdparty/less");
const tree = less.tree;

module.exports = function createImportsPushFunction(env, fileLoader, parserFactory) {
	return function importsPush(path, currentFileInfo, importOptions, callback) {
		const parserImports = this;
		this.queue.push(path);

		const fileParsedFunc = function(e, root, fullPath) {
			parserImports.queue.splice(parserImports.queue.indexOf(path), 1); // Remove the path from the queue

			/* BEGIN MODIFICATION */

			// Replaced "rootFilename" with "env.filename"
			const importedPreviously = fullPath === env.filename;

			/* END MODIFICATION */

			parserImports.files[fullPath] = root; // Store the root

			if (e && !parserImports.error) {
				parserImports.error = e;
			}

			callback(e, root, importedPreviously, fullPath);
		};

		if (less.Parser.importer) {
			less.Parser.importer(path, currentFileInfo, fileParsedFunc, env);
		} else {
			/* BEGIN MODIFICATION */

			// Call custom fileLoader instead of "less.Parser.fileLoader"
			fileLoader(path, currentFileInfo, function(e, contents, fullPath, newFileInfo) {
			/* END MODIFICATION */

				if (e) {
					fileParsedFunc(e); return;
				}

				const newEnv = new tree.parseEnv(env);

				newEnv.currentFileInfo = newFileInfo;
				newEnv.processImports = false;
				newEnv.contents[fullPath] = contents;

				if (currentFileInfo.reference || importOptions.reference) {
					newFileInfo.reference = true;
				}

				if (importOptions.inline) {
					fileParsedFunc(null, contents, fullPath);
				} else {
					/* BEGIN MODIFICATION */

					// Create custom parser when resolving imports
					parserFactory(newEnv, fileLoader).parse(contents, function(e, root) {
					/* END MODIFICATION */

						fileParsedFunc(e, root, fullPath);
					});
				}
			}, env);
		}
	};
};
