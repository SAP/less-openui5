"use strict";
const posixPath = require("path").posix;
const less = require("../thirdparty/less");
const backslashRegExp = /\\/g;

function toPosix(p) {
	return p.replace(backslashRegExp, "/");
}

const VariableCollector = module.exports = function(env) {
	/* eslint-disable new-cap */
	this.oVisitor = new less.tree.visitor(this);
	/* eslint-enable new-cap */
	this.env = env;
	this.mVariables = {};
	this.mGlobalVariables = {};
	this.mVarFile = {};
};

VariableCollector.prototype = {
	isPreVisitor: true,
	run: function(root) {
		this.mGlobalVariables = root.variables();
		return this.oVisitor.visit(root);
	},

	visitRule: function(node) {
		if (!node.variable) {
			return;
		}
		if (!this.mGlobalVariables[node.name]) {
			// Ignoring local variable
			return;
		}
		try {
			const value = node.value.toCSS(this.env);
			this.mVariables[node.name.substr(1)] = {
				value: value,
				filename: node.currentFileInfo.filename,
				rootFilename: node.currentFileInfo.rootFilename
			};
		} catch (err) {
			// Errors might occur within mixins.
			// But as we only collect global variables, this doesn't matter...
		}
	},

	getVariables: function(aImports) {
		const mVariables = {};

		const aPosixImports = aImports.map(toPosix);

		const includeCache = {};

		function shouldIncludeVariable({rootFilename, filename}) {
			// Simple case where variable is defined in root file
			if (rootFilename === filename) {
				return true;
			}

			const cacheKey = rootFilename + "|" + filename;
			if (includeCache[cacheKey] !== undefined) {
				return includeCache[cacheKey];
			}

			const dirname = posixPath.dirname(filename);
			const baseFileName = posixPath.basename(rootFilename); // usually library.source.less

			function check(currentDirname) {
				const libraryBaseFile = posixPath.join(currentDirname, baseFileName);
				if (libraryBaseFile === rootFilename || aPosixImports.includes(libraryBaseFile)) {
					return true;
				} else {
					// Recursively check parent directories whether they contain an imported "base file"
					// This is only relevant when a theme contains sub-directories
					const parentDirname = posixPath.dirname(currentDirname);
					if (parentDirname === currentDirname) {
						return false; // We are at the root
					} else {
						return check(parentDirname);
					}
				}
			}

			return includeCache[cacheKey] = check(dirname);
		}

		for (const name in this.mVariables) {
			if (Object.prototype.hasOwnProperty.call(this.mVariables, name)) {
				const oVar = this.mVariables[name];
				// Ensure posix paths
				const rootFilename = toPosix(oVar.rootFilename);
				const filename = toPosix(oVar.filename);

				// Only add variable if the corresponding library "base file" has been imported
				if (shouldIncludeVariable({rootFilename, filename})) {
					mVariables[name] = oVar.value;
				}
			}
		}

		return mVariables;
	},

	getAllVariables: function(aImports) {
		const mVariables = {};
		for (const name in this.mVariables) {
			if (Object.prototype.hasOwnProperty.call(this.mVariables, name)) {
				const oVar = this.mVariables[name];
				mVariables[name] = oVar.value;
			}
		}
		return mVariables;
	}

};
