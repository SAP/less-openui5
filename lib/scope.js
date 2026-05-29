"use strict";

/**
 * DOM-Elements like html, body as CSS selector needs be handled differently in
 * the scoping. Equivalent to the previous regex-driven implementation, but uses
 * character-level scanning and indexOf to skip the regex hot paths for the
 * overwhelmingly common case of class-only selectors.
 */

// Whitespace test matching JS regex `\s` for the characters that realistically
// appear in CSS selectors after parsing. JS `\s` covers more Unicode chars but
// css-tools normalizes selectors to these.
function isWs(c) {
	// space, \t, \n, \r, \f, \v
	return c === 32 || c === 9 || c === 10 || c === 13 || c === 12 || c === 11;
}

// Returns the start index of the leftmost "html" or "body" substring, or -1.
// Cheap pre-filter to skip the html/body branch entirely when neither appears.
function indexOfHtmlOrBody(s) {
	const ih = s.indexOf("html");
	const ib = s.indexOf("body");
	if (ih === -1) return ib;
	if (ib === -1) return ih;
	return ih < ib ? ih : ib;
}

// Equivalent of /^\s?\./ — selector starts with optional single whitespace
// then a dot. (Original regex was /^\s?\.\w*/; the trailing \w* was meaningless
// for a boolean .test().)
function startsWithDot(s) {
	const c0 = s.charCodeAt(0);
	if (c0 === 46 /* . */) return true;
	return isWs(c0) && s.charCodeAt(1) === 46;
}

// Replace the first whitespace char in s with "" — equivalent to
// `s.replace(/\s/, "")`. Only ever called on strings that actually contain
// whitespace (the caller has matched startsWithDot first), so the unfound
// branch is unreachable in practice but kept for safety.
function stripFirstWhitespace(s) {
	for (let i = 0; i < s.length; i++) {
		if (isWs(s.charCodeAt(i))) {
			return s.substring(0, i) + s.substring(i + 1);
		}
	}
	return s;
}

// Append the scoped form(s) of sSelector directly into aOut.
// The original handleScoping returned a [sSelector1, sSelector2] tuple per
// call; pushing into the caller's array avoids allocating that tuple for every
// selector.
function appendScoped(sSelector, sScopeName, aOut) {
	// Original `rContrast = /.sapContrast/`. The leading `.` was a regex
	// wildcard, so the test is equivalent to "any char followed by sapContrast"
	// — i.e. any sapContrast occurrence at index >= 1.
	if (sSelector.indexOf("sapContrast", 1) !== -1) {
		aOut.push(sSelector);
		return;
	}

	// Cheap rejection: if neither "html" nor "body" substring appears, skip the
	// whole html/body branch.
	const iMatch = indexOfHtmlOrBody(sSelector);

	if (iMatch !== -1) {
		// Find the end of the html/body match (run of non-whitespace).
		let iEnd = iMatch + 4; // both "html" and "body" are 4 chars
		const len = sSelector.length;
		while (iEnd < len && !isWs(sSelector.charCodeAt(iEnd))) iEnd++;

		const sBefore = iMatch === 0 ? "" : sSelector.substring(0, iMatch);
		const sMatched = sSelector.substring(iMatch, iEnd);
		let sAfter = iEnd === len ? "" : sSelector.substring(iEnd);

		if (sBefore === "" && sAfter !== "") {
			// Truncate at a second html/body match if any (preserves the
			// behavior of the original split(rRegex).filter(Boolean) flow,
			// which silently dropped everything from the second match onward).
			const i2 = indexOfHtmlOrBody(sAfter);
			if (i2 !== -1) sAfter = sAfter.substring(0, i2);
		}

		if (sBefore === "" && sAfter === "") {
			aOut.push(sMatched + sScopeName);
			aOut.push(sMatched + " " + sScopeName);
		} else if (sBefore === "") {
			aOut.push(sMatched + " " + sScopeName + sAfter);
			if (startsWithDot(sAfter)) {
				aOut.push(sMatched + " " + sScopeName + stripFirstWhitespace(sAfter));
			}
		} else {
			// sBefore non-empty: original code intentionally drops the after-part.
			aOut.push(sBefore + " " + sScopeName + sMatched);
		}
		return;
	}

	if (startsWithDot(sSelector)) {
		aOut.push(sScopeName + sSelector);
		aOut.push(sScopeName + " " + sSelector);
		return;
	}

	if (sSelector === ":root") {
		aOut.push(sScopeName);
		return;
	}

	aOut.push(sScopeName + " " + sSelector);
}

function Scoping(oSheet, sScopeName) {
	this.oSheet = oSheet;
	this.sScopeName = sScopeName;
	this.sScopeNameSpace = sScopeName + " ";
}

Scoping.prototype.scopeRules = function(oRules) {
	const sScopeName = this.sScopeName;
	const sScopeNameSpace = this.sScopeNameSpace;
	for (let iNode = 0; iNode < oRules.length; iNode++) {
		const oNode = oRules[iNode];

		if (oNode.type === "rule") {
			const aSelectors = oNode.selectors;
			const nSel = aSelectors.length;

			// Common case: a single class selector with no html/body and no
			// sapContrast — produces exactly two scoped variants. Allocate the
			// two-element array directly instead of going through push().
			if (nSel === 1) {
				const s = aSelectors[0];
				if (s.indexOf("sapContrast", 1) === -1 &&
					indexOfHtmlOrBody(s) === -1 &&
					startsWithDot(s)) {
					oNode.selectors = [sScopeName + s, sScopeNameSpace + s];
					continue;
				}
			}

			const aNewSelectors = [];
			for (let i = 0; i < nSel; i++) {
				const sSelector = aSelectors[i];
				const lenBefore = aNewSelectors.length;
				appendScoped(sSelector, sScopeName, aNewSelectors);
				if (aNewSelectors.length === lenBefore) {
					// appendScoped never produced output — preserve the
					// original `aScopedSelectors[0] || sSelector` fallback.
					aNewSelectors.push(sSelector);
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

const rCssScopeRoot = /#CSS_SCOPE_ROOT\b/;

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
