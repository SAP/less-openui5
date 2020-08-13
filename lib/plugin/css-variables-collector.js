"use strict";

const less = require("../thirdparty/less");

const CSSVariablesCollectorPlugin = module.exports = function(config) {
	this.config = config;
	// eslint-disable-next-line new-cap
	this.native = new less.tree.visitor(this);
	this.vars = {};
	this.calcVars = {};
	this.ruleStack = [];
	this.mixinStack = [];
	this.parenStack = [];
	this.importStack = [];
};

CSSVariablesCollectorPlugin.prototype = {

	isPreEvalVisitor: true,
	isReplacing: true,

	_isInMixinOrParen() {
		return this.mixinStack.length > 0 || this.parenStack.length > 0;
	},

	_isVarInRule() {
		return this.ruleStack.length > 0 && !this.ruleStack[this.ruleStack.length - 1].variable;
	},

	_isInGlobalOrBaseImport() {
		return this.config.libName !== "sap.ui.core" && this.importStack.filter((importNode) => {
			return /\/(?:global|base)\.less$/.test(importNode.importedFilename);
		}).length > 0;
	},

	_isRelevant() {
		return !this._isInMixinOrParen() && this._isVarInRule();
	},

	toLessVariables() {
		let lessVariables = "";
		Object.keys(this.vars).forEach((value, index) => {
			lessVariables += "@" + value + ": " + this.vars[value].css + ";\n";
		});
		Object.keys(this.calcVars).forEach((value, index) => {
			lessVariables += "@" + value + ": " + this.calcVars[value].css + ";\n";
		});
		lessVariables += "\n:root {\n";
		Object.keys(this.vars).forEach((value, index) => {
			if (this.vars[value].export) {
				lessVariables += "--" + value + ": @" + value + ";\n";
			}
		});
		Object.keys(this.calcVars).forEach((value, index) => {
			if (this.calcVars[value].export) {
				lessVariables += "--" + value + ": @" + value + ";\n";
			}
		});
		lessVariables += "}\n";
		return lessVariables;
	},

	_getCSS(node) {
		let css = "";

		// override: do not evaluate variables
		less.tree.Variable.prototype.genCSS = function(env, output) {
			new less.tree.Anonymous(this.name, this.index, this.currentFileInfo, this.mapLines).genCSS(env, output);
		};
		// override: keep quoting for less variables
		const fnQuotedgenCSS = less.tree.Quoted.prototype.genCSS;
		less.tree.Quoted.prototype.genCSS = function(env, output) {
			new less.tree.Anonymous((this.escaped ? "~" : "") + this.quote + this.value + this.quote, this.index, this.currentFileInfo, this.mapLines).genCSS(env, output);
		};

		// add the variable declaration to the list of vars
		css = node.toCSS();

		// reset overrides
		less.tree.Variable.prototype.genCSS = undefined;
		less.tree.Quoted.prototype.genCSS = fnQuotedgenCSS;

		return css;
	},

	run(root) {
		return this.native.visit(root);
	},

	visitOperation(node, visitArgs) {
		if (this._isRelevant()) {
			return new less.tree.Call("calc", [new less.tree.Expression([node.operands[0], new less.tree.Anonymous(node.op), node.operands[1]])]);
		}
		return node;
	},

	visitCall(node, visitArgs) {
		// if variables are used inside rules, generate a new dynamic variable for it!
		const isRelevantFunction = typeof less.tree.functions[node.name] === "function" && ["rgba"].indexOf(node.name) === -1;
		if (this._isRelevant() && isRelevantFunction) {
			const css = this._getCSS(node);
			let newName = this.config.prefix + "function_" + node.name + Object.keys(this.vars).length;
			// check for duplicate value in vars already
			for (const name in this.calcVars) {
				if (this.calcVars[name].css === css) {
					newName = name;
					break;
				}
			}
			this.calcVars[newName] = {
				css: css,
				export: !this._isInGlobalOrBaseImport()
			};
			return new less.tree.Call("var", [new less.tree.Anonymous("--" + newName, node.index, node.currentFileInfo, node.mapLines)]);
		}
		return node;
	},

	visitNegative(node, visitArgs) {
		// convert negative into calc function
		if (this._isRelevant()) {
			return new less.tree.Call("calc", [new less.tree.Expression([new less.tree.Anonymous("-1"), new less.tree.Anonymous("*"), node.value])]);
		}
		return node;
	},

	visitVariable(node, visitArgs) {
		// convert less variables into CSS variables
		if (this._isRelevant()) {
			return new less.tree.Call("var", [new less.tree.Anonymous(node.name.replace(/^@/, "--"), node.index, node.currentFileInfo, node.mapLines)]);
		}
		return node;
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

	visitMixinDefinition(node, visitArgs) {
		// store the mixin context
		this.mixinStack.push(node);
		return node;
	},

	visitMixinDefinitionOut(node) {
		// remove mixin context
		this.mixinStack.pop();
		return node;
	},

	visitParen(node, visitArgs) {
		// store the parenthesis context
		this.parenStack.push(node);
		return node;
	},

	visitParenOut(node) {
		// remove parenthesis context
		this.parenStack.pop();
		return node;
	},

	visitImport(node, visitArgs) {
		// store the import context
		this.importStack.push(node);
		return node;
	},

	visitImportOut(node) {
		// remove import context
		this.importStack.pop();
		return node;
	},

	visitRuleset(node, visitArgs) {
		node.rules.forEach((value) => {
			const isVarDeclaration = value instanceof less.tree.Rule && typeof value.name === "string" && value.name.startsWith("@");
			if (!this._isInMixinOrParen() && isVarDeclaration) {
				// add the variable declaration to the list of vars
				this.vars[value.name.substr(1)] = {
					css: this._getCSS(value.value),
					export: !this._isInGlobalOrBaseImport()
				};
			}
		});
		return node;
	}

};
