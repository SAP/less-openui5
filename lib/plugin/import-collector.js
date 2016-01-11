// Copyright 2016 SAP SE.
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

'use strict';

var less = require('less');

var ImportCollector = module.exports = function() {
	/*eslint-disable new-cap */
	this.oVisitor = new less.tree.visitor(this);
	/*eslint-enable new-cap */
	this.aImports = [];
};

ImportCollector.prototype = {
	isPreEvalVisitor: true,
	run: function (root) {
		this.oVisitor.visit(root);
	},
	visitImport: function(importNode, visitArgs) {
		if (importNode.importedFilename) {
			this.aImports.push(importNode.importedFilename);
		}
	},
	getImports: function() {
		return this.aImports;
	}
};
