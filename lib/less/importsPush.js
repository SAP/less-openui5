/* !
 * LESS - Leaner CSS v1.6.3
 * http://lesscss.org
 *
 * Copyright (c) 2009-2014, Alexis Sellier <self@cloudhead.net>
 * Licensed under the Apache v2 License.
 *
 *
 * This file contains a modified version of the local function "imports.push" within the constructor of "less.Parser"
 * which has been taken from LESS v1.6.3 (https://github.com/less/less.js/blob/v1.6.3/lib/less/parser.js#L70-L111)
 * and applied commit https://github.com/less/less.js/commit/ccd8ebbfdfa300b6e748e8d7c12e3dbb0efd8371.
 * Modifications are marked with comments in the code.
 *
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
