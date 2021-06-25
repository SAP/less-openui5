"use strict";

const less = require("../thirdparty/less");

const CSSVariablesUrlResolverPlugin = module.exports = function(config) {
	this.config = config;
	// eslint-disable-next-line new-cap
	this.native = new less.tree.visitor(this);
	this.vars = {};
	this.ruleStack = [];
};

CSSVariablesUrlResolverPlugin.prototype = {

	isPreVisitor: true,

	run(root) {
		return this.native.visit(root);
	},

	getVariables() {
		return this.vars;
	},

	visitRule(node, visitArgs) {
		// store the rule context for the call variable extraction
		this.ruleStack.push(node);
		return node;
	},

	visitRuleOut(node) {
		// remove rule context
		this.ruleStack.pop();
		return node;
	},

	visitUrl(node, visitArgs) {
		// for top-level variables we need the resolved urls
		if (this.ruleStack.length > 0 && this.ruleStack[0].variable) {
			const varName = this.ruleStack[0].name.substr(1);
			this.vars[varName] = {
				css: node.toCSS()
			};
		}
		return node;
	}

};
