"use strict";

/**
 * DOM-Elements like html, body as CSS selector needs be handled differently in
 * the scoping. Those selectors will be identified by matching the respective
 * regEx.
 */
const rRegex = /(html[^\s]*|body[^\s]*)/;

const rPoint = /(^\s?\.{1}\w*)/;

function handleScoping(sSelector, sScopeName) {
	/**
	 * Match the selector to regex, by splitting into two array elements,
	 * where the first element is the resulting matching group.
	 */
	const aCaptureGroups = sSelector.split(rRegex);

	const aSelectors = [];
	let sSelector1; let sSelector2;

	// filter empty strings and undefined objects
	const aMatch = aCaptureGroups.filter(function(n) {
		return !!n;
	});

	if (aMatch.length > 1) {
		// set scope name after matching group.
		sSelector1 = aMatch[0] + " " + sScopeName + (aMatch[1] || "");

		// match rPoint to check if following capture group
		// starts with a css class or dom element
		if (aMatch[1].match(rPoint)) {
			sSelector2 = aMatch[0] + " " + sScopeName +
				aMatch[1].replace(/\s/, "");
		} else {
			// no match, selector is a dom element
			sSelector2 = null;
		}
	} else {
		// match if capture group starts with css rule
		if (aMatch[0].match(rPoint)) {
			// set scope before selector
			sSelector1 = sScopeName + aMatch[0];
			sSelector2 = sScopeName + " " + aMatch[0];
		} else {
			if (aMatch[0] === ":root") {
				// remove the :root scope
				sSelector1 = sScopeName;
				sSelector2 = null;
			} else if (aMatch[0].match(rRegex)) {
				// selector matches custom css rule
				sSelector1 = aMatch[0] + sScopeName;
				sSelector2 = aMatch[0] + " " + sScopeName;
			} else {
				// DOM element, add space
				sSelector1 = sScopeName + " " + aMatch[0];
				sSelector2 = null;
			}
		}
	}

	aSelectors.push(sSelector1);
	aSelectors.push(sSelector2);

	return aSelectors;
}

function Scoping(oSheet, sScopeName) {
	this.oSheet = oSheet;
	this.sScopeName = sScopeName;
}

Scoping.prototype.scopeRules = function(oRules) {
	for (let iNode = 0; iNode < oRules.length; iNode++) {
		const oNode = oRules[iNode];

		if (oNode.type === "rule") {
			const aNewSelectors = [];

			for (let i = 0; i < oNode.selectors.length; i++) {
				let sSelector = oNode.selectors[i];
				let sSelector2;

				if (!(sSelector.match(/.sapContrast/))) {
					const aScopedSelectors = handleScoping(sSelector, this.sScopeName);
					sSelector = (aScopedSelectors[0] ? aScopedSelectors[0] : sSelector);
					sSelector2 = (aScopedSelectors[1] ? aScopedSelectors[1] : null);

					aNewSelectors.push(sSelector);
					if (sSelector2) {
						aNewSelectors.push(sSelector2);
					}
				} else {
					// scope name already exists
					aNewSelectors.push(sSelector);
				}
			}

			if (aNewSelectors.length > 0) {
				oNode.selectors = aNewSelectors;
			}
		} else if (oNode.type === "atrule" && oNode.name === "media") {
			this.scopeRules(oNode.nodes);
		}
	}
};

Scoping.prototype.run = function() {
	this.scopeRules(this.oSheet.nodes);
	return this.oSheet;
};


module.exports = function scope(oSheet, sScopeName) {
	return new Scoping(oSheet, sScopeName).run();
};

module.exports.scopeCssRoot = function scopeCssRoot(oRules, sScopeName) {
	for (let iNode = 0; iNode < oRules.length; iNode++) {
		const oNode = oRules[iNode];

		if (oNode.type === "rule") {
			// postcss exposes `selectors` as a getter that splits `selector`
			// into a fresh array on each access, so the mutated array must be
			// assigned back to persist the change.
			const aSelectors = oNode.selectors;
			for (let i = 0; i < aSelectors.length; i++) {
				if (aSelectors[i].match(/#CSS_SCOPE_ROOT\b/)) {
					aSelectors[i] = "." + sScopeName;
					oNode.selectors = aSelectors;

					oNode.remove();

					return oNode;
				}
			}
		}
	}
};
