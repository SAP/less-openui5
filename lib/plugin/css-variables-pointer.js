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

const CSSVariablesPointerPlugin = module.exports = function(config) {
	this.config = config;
	// eslint-disable-next-line new-cap
	this.native = new less.tree.visitor(this);
	this.ruleStack = [];
	this.callStack = [];
	this.mVars = {};
};

CSSVariablesPointerPlugin.prototype = {

	isPreEvalVisitor: true,
	isReplacing: true,

	run(root) {
		return this.native.visit(root);
	},

	visitRule(node, visitArgs) {
		// store the rule context for the call variable extraction
		this.ruleStack.push(node);
		// replace the direct less variable assignment with the css variable
		if (Array.isArray(node.name) && node.name[0] instanceof less.tree.Keyword && this.mVars[node.name[0].value]) {
			node.value = new less.tree.Anonymous(this.mVars[node.name[0].value], node.index, node.currentFileInfo, node.mapLines);
		}
		return node;
	},

	visitRuleOut(node) {
		// remove rule context
		this.ruleStack.pop();
		return node;
	},

	visitCall(node, visitArgs) {
		// store the call context for the call variable extraction
		this.callStack.push(node);
		return node;
	},

	visitCallOut(node, visitArgs) {
		// remove call context
		this.callStack.pop();
		return node;
	},

	_isVariableAssignment(rule) {
		// determines a simple less variable assignment:
		// Rule > Value => Array[length=1] > Expression => Array[length=1] > Variable
		const value = rule && rule.variable &&
			rule.value instanceof less.tree.Value && rule.value;
		const expression = value &&
			Array.isArray(value.value) && value.value.length == 1 &&
			value.value[0] instanceof less.tree.Expression && value.value[0];
		const variable = expression &&
			Array.isArray(expression.value) && expression.value.length == 1 &&
			expression.value[0] instanceof less.tree.Variable && expression.value[0];
		return variable;
	},

	visitVariable(node, visitArgs) {
		// collect all simple less variables to less variables mapping (to convert them to css variables assignments)
		if (this.callStack.length == 0 && this.ruleStack.length > 0 &&
			this._isVariableAssignment(this.ruleStack[this.ruleStack.length - 1])) {
			this.mVars["--" + this.ruleStack[0].name.substr(1)] = "var(" + node.name.replace(/^@/, "--") + ")";
		}
		return node;
	}

};
