"use strict";
const path = require("path");
const less = require("../thirdparty/less");

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

		function shouldIncludeVariable({rootFilename, filename}) {
			// Simple case where variable is defined in root file
			if (rootFilename === filename) {
				return true;
			}

			const dirname = path.posix.dirname(filename);
			const baseFileName = path.posix.basename(rootFilename); // usually library.source.less

			function check(currentDirname) {
				currentDirname = path.posix.normalize(currentDirname);
				if (currentDirname === "." || currentDirname === "/") {
					// Check for root (relative / absolute)
					return false;
				}
				const libraryBaseFile = path.posix.join(currentDirname, baseFileName);
				if (libraryBaseFile === rootFilename || aImports.includes(libraryBaseFile)) {
					return true;
				} else {
					// Check whether libraryBaseFile of parent directory is imported
					return check(path.posix.join(currentDirname, ".."));
				}
			}

			return check(dirname);
		}

		for (const name in this.mVariables) {
			if (Object.prototype.hasOwnProperty.call(this.mVariables, name)) {
				const oVar = this.mVariables[name];
				const {rootFilename, filename} = oVar;

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
