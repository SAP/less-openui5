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

		for (const name in this.mVariables) {
			if (Object.prototype.hasOwnProperty.call(this.mVariables, name)) {
				const oVar = this.mVariables[name];
				const dirname = path.posix.dirname(oVar.filename);
				const baseFileName = path.posix.basename(oVar.rootFilename); // usually library.source.less
				const libraryBaseFile = path.posix.normalize(path.posix.join(dirname, baseFileName));

				// Only add variable if the corresponding library "base file" has been imported
				if (aImports.indexOf(libraryBaseFile) > -1 || libraryBaseFile === oVar.rootFilename) {
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
