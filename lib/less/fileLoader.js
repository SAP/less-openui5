/*
 * This file contains a modified version of the function "less.Parser.fileLoader"
 * from /lib/thirdparty/less/index.js (L127-L233).
 * Modifications are marked with comments in the code.
 */

"use strict";

module.exports = function createFileLoader(fileHandler) {
	return function fileLoader(file, currentFileInfo, callback, env) {
		/* BEGIN MODIFICATION */

		// Removed unused variables "dirname, data"
		let pathname;


		const newFileInfo = {
			relativeUrls: env.relativeUrls,
			entryPath: currentFileInfo.entryPath,
			rootpath: currentFileInfo.rootpath,
			rootFilename: currentFileInfo.rootFilename
		};

		/* END MODIFICATION */

		function handleDataAndCallCallback(data) {
			const j = file.lastIndexOf("/");

			// Pass on an updated rootpath if path of imported file is relative and file
			// is in a (sub|sup) directory
			//
			// Examples:
			// - If path of imported file is 'module/nav/nav.less' and rootpath is 'less/',
			//   then rootpath should become 'less/module/nav/'
			// - If path of imported file is '../mixins.less' and rootpath is 'less/',
			//   then rootpath should become 'less/../'
			if (newFileInfo.relativeUrls && !/^(?:[a-z-]+:|\/)/.test(file) && j != -1) {
				const relativeSubDirectory = file.slice(0, j+1);
				newFileInfo.rootpath = newFileInfo.rootpath + relativeSubDirectory; // append (sub|sup) directory path of imported file
			}
			// eslint-disable-next-line no-useless-escape
			newFileInfo.currentDirectory = pathname.replace(/[^\\\/]*$/, "");
			newFileInfo.filename = pathname;

			callback(null, data, pathname, newFileInfo);
		}

		/* BEGIN MODIFICATION */

		// Call custom function to handle file loading
		fileHandler(file, currentFileInfo, function(resolvedPathname, data) {
			pathname = resolvedPathname;
			handleDataAndCallCallback(data);
		}, callback);

		// The remainder of this function has been completely removed

		/* END MODIFICATION */
	};
};
