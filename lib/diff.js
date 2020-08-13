"use strict";

// Regular expression to match type of property in order to check whether
// it possibly contains color values.
const rProperties = /(color|background|border|text|outline)(?!-(width|radius|offset|style|align|overflow|transform))(-(color|shadow|image))?/;

function selectorEquals(s1, s2) {
	// Make sure there is the same number of select parts
	if (s1.length !== s2.length) {
		return false;
	}

	// Check if all the parts are the same strings
	for (let i = 0; i < s1.length; i++) {
		if (s1[i] !== s2[i]) {
			return false;
		}
	}

	return true;
}

function Diffing(oBase, oCompare) {
	this.oBase = oBase;
	this.oCompare = oCompare;

	this.oDiff = {
		type: "stylesheet",
		stylesheet: {
			rules: []
		},
	};

	this.oStack = {
		type: "stylesheet",
		stylesheet: {
			rules: []
		},
	};
}

Diffing.prototype.diffRules = function(oBaseRules, oCompareRules) {
	const aDiffRules = [];
	let iBaseNode; let iCompareNode;

	for (iBaseNode = 0, iCompareNode = 0; iBaseNode < oBaseRules.length; iBaseNode++, iCompareNode++) {
		const oBaseNode = oBaseRules[iBaseNode];
		let oCompareNode = oCompareRules[iCompareNode];
		let oDiffNode = null;

		// Add all different compare nodes to stack and check for next one
		while (oCompareNode && oBaseNode.type !== oCompareNode.type) {
			this.oStack.stylesheet.rules.push(oCompareNode);
			iCompareNode++;
			oCompareNode = oCompareRules[iCompareNode];
		}

		if (oCompareNode && oBaseNode.type === "comment") {
			const sBaseComment = oBaseNode.comment;
			const sCompareComment = oCompareNode.comment;

			if (sBaseComment !== sCompareComment) {
				oDiffNode = oCompareNode;
			}
		}

		if (oBaseNode.type === "rule") {
			// Add all rules with different selector to stack and check for next one
			while (oCompareNode && (oCompareNode.type !== "rule" || !selectorEquals(oBaseNode.selectors, oCompareNode.selectors))) {
				this.oStack.stylesheet.rules.push(oCompareNode);
				iCompareNode++;
				oCompareNode = oCompareRules[iCompareNode];
			}

			const aBaseDeclarations = oBaseNode.declarations;
			const aCompareDeclarations = oCompareNode && oCompareNode.declarations;
			for (let j = 0; j < aBaseDeclarations.length; j++) {
				const oBaseDeclaration = aBaseDeclarations[j];
				const oCompareDeclaration = aCompareDeclarations && aCompareDeclarations[j];

				if (oCompareDeclaration && oBaseDeclaration.type === "declaration") {
					// TODO: Also check for different node and add to stack???
					if (oBaseDeclaration.type === oCompareDeclaration.type) {
						if (oBaseDeclaration.property === oCompareDeclaration.property) {
							// Always add color properties to diff to prevent unexpected CSS overrides
							// due to selectors with more importance
							if (oBaseDeclaration.value !== oCompareDeclaration.value ||
									oCompareDeclaration.property.match(rProperties)) {
								// Add compared rule to diff
								if (!oDiffNode) {
									oDiffNode = oCompareNode;
									oDiffNode.declarations = [];
								}
								oDiffNode.declarations.push(oCompareDeclaration);
							}
						}
					}
				}
			}
		} else if (oCompareNode && oBaseNode.type === "media") {
			const aMediaDiffRules = this.diffRules(oBaseNode.rules, oCompareNode.rules);

			if (aMediaDiffRules.length > 0) {
				oDiffNode = oCompareNode;
				oDiffNode.rules = aMediaDiffRules;
			}
		}

		if (oDiffNode) {
			aDiffRules.push(oDiffNode);
		}
	}

	// Add all leftover compare nodes to stack
	for (; iCompareNode < oCompareRules.length; iCompareNode++) {
		this.oStack.stylesheet.rules.push(oCompareRules[iCompareNode]);
	}

	return aDiffRules;
};

Diffing.prototype.run = function() {
	const oBaseRules = this.oBase.stylesheet.rules;
	const oCompareRules = this.oCompare.stylesheet.rules;

	this.oDiff.stylesheet.rules = this.diffRules(oBaseRules, oCompareRules);

	return {
		diff: this.oDiff,
		stack: this.oStack
	};
};


module.exports = function diff(oBase, oCompare) {
	return new Diffing(oBase, oCompare).run();
};
