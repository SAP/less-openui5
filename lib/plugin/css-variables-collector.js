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
};

CSSVariablesCollectorPlugin.prototype = {

	// needed to keep the less variable references intact to use this info for the CSS variables references
	isPreEvalVisitor: true,

	isReplacing: true,

	_isInMixinOrParen() {
		return this.mixinStack.length > 0 || this.parenStack.length > 0;
	},

	_isVarInRule() {
		return this.ruleStack.length > 0 && !this.ruleStack[this.ruleStack.length - 1].variable;
	},

	_isVarInLibrary({filename} = {}) {
		// for libraries we check that the file is within the libraries theme path
		// in all other cases with no filename (indicates calculated variables)
		// or in case of variables in standalone less files we just include them!
		const regex = new RegExp(`(^|/)${this.config.libPath}/themes/`);
		const include = !filename ||
			(this.config.libPath ? regex.test(filename) : true);
		return include;
	},

	_isRelevant() {
		return !this._isInMixinOrParen() && this._isVarInRule();
	},

	toLessVariables(varsOverride) {
		const vars = {};
		Object.keys(this.vars).forEach((key) => {
			const override = this.vars[key].updateAfterEval && varsOverride[key] !== undefined;
			/*
			if (override) {
				console.log(`Override variable "${key}" from "${this.vars[key].css}" to "${varsOverride[key]}"`);
			}
			*/
			vars[key] = {
				css: override ? varsOverride[key] : this.vars[key].css,
				export: this.vars[key].export
			};
		});
		let lessVariables = "";
		Object.keys(vars).forEach((value, index) => {
			lessVariables += "@" + value + ": " + vars[value].css + ";\n";
		});
		Object.keys(this.calcVars).forEach((value, index) => {
			lessVariables += "@" + value + ": " + this.calcVars[value].css + ";\n";
		});
		lessVariables += "\n:root {\n";
		Object.keys(vars).forEach((value, index) => {
			if (vars[value].export) {
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
			// console.log("visitOperation", this.ruleStack[this.ruleStack.length - 1], this._getCSS(node));
			return new less.tree.Call("calc", [new less.tree.Expression([node.operands[0], new less.tree.Anonymous(node.op), node.operands[1]])]);
		}
		return node;
	},

	visitCall(node, visitArgs) {
		// if variables are used inside rules, generate a new calculated variable for it!
		const isRelevantFunction = typeof less.tree.functions[node.name] === "function" && ["rgba"].indexOf(node.name) === -1;
		if (this._isRelevant() && isRelevantFunction) {
			// console.log("visitCall", this.ruleStack[this.ruleStack.length - 1], this._getCSS(node));
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
				export: this._isVarInLibrary()
			};
			return new less.tree.Call("var", [new less.tree.Anonymous("--" + newName, node.index, node.currentFileInfo, node.mapLines)]);
		}
		return node;
	},

	visitNegative(node, visitArgs) {
		// convert negative into calc function
		if (this._isRelevant()) {
			// console.log("visitNegative", this.ruleStack[this.ruleStack.length - 1], this._getCSS(node));
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
		// check rule for being a variable declaration
		const isVarDeclaration = typeof node.name === "string" && node.name.startsWith("@");
		if (!this._isInMixinOrParen() && isVarDeclaration) {
			// add the variable declaration to the list of vars
			const varName = node.name.substr(1);
			const isVarInLib = this._isVarInLibrary({
				filename: node.currentFileInfo.filename
			});
			this.vars[varName] = {
				css: this._getCSS(node.value),
				export: isVarInLib
			};
		}
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

	visitUrl(node, visitArgs) {
		// we mark the less variables which should be updated after eval
		// => strangewise less variables with "none" values are also urls
		//    after the less variables have been evaluated
		if (this.ruleStack.length > 0 && this.ruleStack[0].variable) {
			this.vars[this.ruleStack[0].name.substr(1)].updateAfterEval = true;
		}
		return node;
	}

};
