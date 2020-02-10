// Copyright 2020 SAP SE.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http: //www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
// either express or implied. See the License for the specific
// language governing permissions and limitations under the License.

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
