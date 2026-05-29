"use strict";

/**
 * DOM-Elements like html, body as CSS selector needs be handled differently in
 * the scoping. Those selectors will be identified by matching the respective
 * regEx.
 */
const rRegex = /(html[^\s]*|body[^\s]*)/;

const rPoint = /^\s?\.\w*/;

const rContrast = /.sapContrast/;

const rWhitespace = /\s/;

const rCssScopeRoot = /#CSS_SCOPE_ROOT\b/;

function handleScoping(sSelector, sScopeName) {
	// Single regex scan replaces the previous `split(rRegex).filter(Boolean)` flow.
	// `match.index` + matched length give us the same three logical pieces
	// (before-match, matched, after-match) without allocating an intermediate array.
	const oMatch = rRegex.exec(sSelector);

	let sSelector1; let sSelector2 = null;

	if (oMatch) {
		const sMatched = oMatch[1];
		const sBefore = sSelector.substring(0, oMatch.index);
		let sAfter = sSelector.substring(oMatch.index + sMatched.length);

		if (sBefore === "" && sAfter !== "") {
			// The original `split(rRegex).filter(Boolean)` produces extra segments when the
			// selector contains a second html/body match (e.g. "html, body"); only the
			// segment between the first match and the next match is used, anything from
			// the second match onward is silently dropped. Replicate that truncation.
			const oMatch2 = rRegex.exec(sAfter);
			if (oMatch2) {
				sAfter = sAfter.substring(0, oMatch2.index);
			}
		}

		if (sBefore === "" && sAfter === "") {
			// Selector is exactly the html/body match — equivalent to original `aMatch.length === 1`
			// path that falls through to the `aMatch[0].match(rRegex)` branch.
			sSelector1 = sMatched + sScopeName;
			sSelector2 = sMatched + " " + sScopeName;
		} else if (sBefore === "") {
			// Original split+filter would yield aMatch=[matched, sAfter] (length 2).
			// aMatch[0]=matched, aMatch[1]=sAfter.
			sSelector1 = sMatched + " " + sScopeName + sAfter;

			// Check whether sAfter starts with optional whitespace + class.
			if (rPoint.test(sAfter)) {
				sSelector2 = sMatched + " " + sScopeName + sAfter.replace(rWhitespace, "");
			}
		} else {
			// sBefore non-empty: original aMatch=[sBefore, matched, ...] →
			// aMatch[0]=sBefore, aMatch[1]=matched.
			// Since matched starts with html/body, rPoint never matches it → sSelector2 stays null.
			// Note: original code intentionally drops the after-part here (preserved).
			sSelector1 = sBefore + " " + sScopeName + sMatched;
		}
	} else if (rPoint.test(sSelector)) {
		// Selector starts with a class — set scope before selector.
		sSelector1 = sScopeName + sSelector;
		sSelector2 = sScopeName + " " + sSelector;
	} else if (sSelector === ":root") {
		// Remove the :root scope.
		sSelector1 = sScopeName;
	} else {
		// Plain DOM element — add space.
		sSelector1 = sScopeName + " " + sSelector;
	}

	return [sSelector1, sSelector2];
}

function Scoping(oSheet, sScopeName) {
	this.oSheet = oSheet;
	this.sScopeName = sScopeName;
}

Scoping.prototype.scopeRules = function(oRules) {
	const sScopeName = this.sScopeName;
	for (let iNode = 0; iNode < oRules.length; iNode++) {
		const oNode = oRules[iNode];

		if (oNode.type === "rule") {
			const aSelectors = oNode.selectors;
			const aNewSelectors = [];

			for (let i = 0; i < aSelectors.length; i++) {
				const sSelector = aSelectors[i];

				if (rContrast.test(sSelector)) {
					// scope name already exists
					aNewSelectors.push(sSelector);
				} else {
					const aScopedSelectors = handleScoping(sSelector, sScopeName);
					aNewSelectors.push(aScopedSelectors[0] || sSelector);
					if (aScopedSelectors[1]) {
						aNewSelectors.push(aScopedSelectors[1]);
					}
				}
			}

			if (aNewSelectors.length > 0) {
				oNode.selectors = aNewSelectors;
			}
		} else if (oNode.type === "media") {
			this.scopeRules(oNode.rules);
		}
	}
};

Scoping.prototype.run = function() {
	this.scopeRules(this.oSheet.stylesheet.rules);
	return this.oSheet;
};


module.exports = function scope(oSheet, sScopeName) {
	return new Scoping(oSheet, sScopeName).run();
};

module.exports.scopeCssRoot = function scopeCssRoot(oRules, sScopeName) {
	for (let iNode = 0; iNode < oRules.length; iNode++) {
		const oNode = oRules[iNode];

		if (oNode.type === "rule") {
			const aSelectors = oNode.selectors;
			for (let i = 0; i < aSelectors.length; i++) {
				if (rCssScopeRoot.test(aSelectors[i])) {
					aSelectors[i] = "." + sScopeName;

					oRules.splice(iNode, 1);

					return oNode;
				}
			}
		}
	}
};
