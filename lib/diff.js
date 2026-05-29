"use strict";

const postcss = require("postcss");

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

function isMedia(node) {
	return node && node.type === "atrule" && node.name === "media";
}

// Treat all @media at-rules as a single equivalence class so the lockstep
// walk lines them up the way css-tools' "media" type did.
function nodeKind(node) {
	if (isMedia(node)) return "media";
	return node.type;
}

function Diffing(oBase, oCompare) {
	this.oBase = oBase;
	this.oCompare = oCompare;

	this.oDiff = new postcss.Root();
	this.oStack = new postcss.Root();
}

Diffing.prototype.pushToStack = function(oNode) {
	this.oStack.append(oNode.clone());
};

Diffing.prototype.diffRules = function(oBaseRules, oCompareRules) {
	const aDiffRules = [];
	let iBaseNode; let iCompareNode;

	for (iBaseNode = 0, iCompareNode = 0; iBaseNode < oBaseRules.length; iBaseNode++, iCompareNode++) {
		const oBaseNode = oBaseRules[iBaseNode];
		let oCompareNode = oCompareRules[iCompareNode];
		let oDiffNode = null;

		const sBaseKind = nodeKind(oBaseNode);

		// Add all different compare nodes to stack and check for next one
		while (oCompareNode && sBaseKind !== nodeKind(oCompareNode)) {
			this.pushToStack(oCompareNode);
			iCompareNode++;
			oCompareNode = oCompareRules[iCompareNode];
		}

		if (oCompareNode && oBaseNode.type === "comment") {
			const sBaseComment = oBaseNode.text;
			const sCompareComment = oCompareNode.text;

			if (sBaseComment !== sCompareComment) {
				oDiffNode = oCompareNode.clone();
			}
		}

		if (oBaseNode.type === "rule") {
			// Add all rules with different selector to stack and check for next one
			while (oCompareNode && (oCompareNode.type !== "rule" || !selectorEquals(oBaseNode.selectors, oCompareNode.selectors))) {
				this.pushToStack(oCompareNode);
				iCompareNode++;
				oCompareNode = oCompareRules[iCompareNode];
			}

			const aBaseDeclarations = oBaseNode.nodes;
			const aCompareDeclarations = oCompareNode && oCompareNode.nodes;
			for (let j = 0; j < aBaseDeclarations.length; j++) {
				const oBaseDeclaration = aBaseDeclarations[j];
				const oCompareDeclaration = aCompareDeclarations && aCompareDeclarations[j];

				if (oCompareDeclaration && oBaseDeclaration.type === "decl") {
					// TODO: Also check for different node and add to stack???
					if (oBaseDeclaration.type === oCompareDeclaration.type) {
						if (oBaseDeclaration.prop === oCompareDeclaration.prop) {
							// Always add color properties to diff to prevent unexpected CSS overrides
							// due to selectors with more importance
							if (oBaseDeclaration.value !== oCompareDeclaration.value ||
									oCompareDeclaration.prop.match(rProperties)) {
								// Add compared rule to diff
								if (!oDiffNode) {
									oDiffNode = oCompareNode.clone();
									oDiffNode.removeAll();
								}
								oDiffNode.append(oCompareDeclaration.clone());
							}
						}
					}
				}
			}
		} else if (oCompareNode && isMedia(oBaseNode)) {
			const aMediaDiffRules = this.diffRules(oBaseNode.nodes, oCompareNode.nodes);

			if (aMediaDiffRules.length > 0) {
				oDiffNode = oCompareNode.clone();
				oDiffNode.removeAll();
				for (const r of aMediaDiffRules) {
					oDiffNode.append(r);
				}
			}
		}

		if (oDiffNode) {
			aDiffRules.push(oDiffNode);
		}
	}

	// Add all leftover compare nodes to stack
	for (; iCompareNode < oCompareRules.length; iCompareNode++) {
		this.pushToStack(oCompareRules[iCompareNode]);
	}

	return aDiffRules;
};

Diffing.prototype.run = function() {
	const aDiffRules = this.diffRules(this.oBase.nodes, this.oCompare.nodes);
	for (const r of aDiffRules) {
		this.oDiff.append(r);
	}

	return {
		diff: this.oDiff,
		stack: this.oStack
	};
};


module.exports = function diff(oBase, oCompare) {
	return new Diffing(oBase, oCompare).run();
};
