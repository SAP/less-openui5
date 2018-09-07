// Copyright 2018 SAP SE.
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
let path = require("path");
let less = require("less");

let VariableCollector = module.exports = function(env) {
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
			let value = node.value.toCSS(this.env);
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
		let mVariables = {};

		for (let name in this.mVariables) {
			if (this.mVariables.hasOwnProperty(name)) {
				let oVar = this.mVariables[name];
				let dirname = path.posix.dirname(oVar.filename);
				let baseFileName = path.posix.basename(oVar.rootFilename); // usually library.source.less
				let libraryBaseFile = path.posix.normalize(path.posix.join(dirname, baseFileName));

				// Only add variable if the corresponding library "base file" has been imported
				if (aImports.indexOf(libraryBaseFile) > -1 || libraryBaseFile === oVar.rootFilename) {
					mVariables[name] = oVar.value;
				}
			}
		}

		return mVariables;
	},

	getAllVariables: function(aImports) {
		let mVariables = {};
		for (let name in this.mVariables) {
			if (this.mVariables.hasOwnProperty(name)) {
				let oVar = this.mVariables[name];
				mVariables[name] = oVar.value;
			}
		}
		return mVariables;
	}

};
