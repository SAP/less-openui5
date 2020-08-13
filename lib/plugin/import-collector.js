"use strict";

const less = require("../thirdparty/less");

const ImportCollector = module.exports = function(options) {
	/* eslint-disable new-cap */
	this.oVisitor = new less.tree.visitor(this);
	/* eslint-enable new-cap */

	this.aImports = [];

	this.mImportMappings = options && options.importMappings ? options.importMappings : {};
};

ImportCollector.prototype = {
	isPreEvalVisitor: true,
	run: function(root) {
		this.oVisitor.visit(root);
	},
	visitImport: function(importNode, visitArgs) {
		if (importNode.importedFilename) {
			const fullImportPath = this.mImportMappings[importNode.importedFilename];
			if (fullImportPath) {
				this.aImports.push(fullImportPath);
			} else {
				this.aImports.push(importNode.importedFilename);
			}
		}
	},
	getImports: function() {
		return this.aImports;
	}
};
