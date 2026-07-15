/* eslint-env mocha */
"use strict";

const assert = require("assert");
const postcss = require("postcss");
const fs = require("fs");
const path = require("path");

// tested module
const diff = require("../lib/diff");

const options = {
	encoding: "utf8"
};

const cssPath = "test/fixtures/diff/css";

describe("Diff algorithm", function() {
	it("should create a diff with moved comment block in compare and additional rule in compare", function() {
		const compareCSS = fs.readFileSync(path.join(cssPath, "library1/compare.css"), options);
		const baseCSS = fs.readFileSync(path.join(cssPath, "library1/base.css"), options);

		// Create diff object between embeddedCompare and embedded
		const oBase = postcss.parse(baseCSS);
		const oEmbedded = postcss.parse(compareCSS);

		const oResult = diff(oBase, oEmbedded);

		assert.deepStrictEqual(oResult.diff.nodes.map(convertRuleToComparableString), [
			{
				"type": "rule",
				"value": "a"
			},
			{
				"type": "rule",
				"value": "b"
			},
			{
				"type": "comment",
				"value": "mine"
			},
			{
				"type": "rule",
				"value": "b.test"
			}
		]);
		assert.deepStrictEqual(oResult.stack.nodes.map(convertRuleToComparableString), [
			{
				"type": "rule",
				"value": "html"
			},
			{
				"type": "comment",
				"value": "mine2"
			},
			{
				"type": "comment",
				"value": "single"
			}
		]);
	});
	it("should create a diff with more rules in base than in compare", function() {
		const compareCSS = fs.readFileSync(path.join(cssPath, "library2/compare.css"), options);
		const baseCSS = fs.readFileSync(path.join(cssPath, "library2/base.css"), options);

		// Create diff object between embeddedCompare and embedded
		const oBase = postcss.parse(baseCSS);
		const oEmbedded = postcss.parse(compareCSS);

		const oResult = diff(oBase, oEmbedded);

		assert.deepStrictEqual(oResult.diff.nodes.map(convertRuleToComparableString), [
			{
				"type": "rule",
				"value": "a"
			},
			{
				"type": "rule",
				"value": "b"
			}
		]);
		assert.deepStrictEqual(oResult.stack.nodes.map(convertRuleToComparableString), []);
	});

	it("should never split a /*!SAP_POSTPROCESS_REDUCE_START/END*/ marker pair across diff and stack", function() {
		// A leading-comment count asymmetry between the base compile and the contrast
		// compile shifts the lockstep walk by one node. That used to move one half of
		// a REDUCE marker pair into the diff (always appended) or the stack (appended
		// for cascading themes like *_plus) while the other half stayed elsewhere —
		// orphaning the marker in the emitted CSS. Marker/banner comments are
		// `/*! ... */` important comments and must never be carried into either.
		const body = (color) =>
			".pre{color:black}" +
			"/*!SAP_POSTPROCESS_REDUCE_START*/" +
			".a{color:" + color + "}" +
			"/*!SAP_POSTPROCESS_REDUCE_END*/" +
			".post{color:black}";

		const countMarkers = function(root, marker) {
			let n = 0;
			root.walkComments(function(c) {
				if (c.text.indexOf(marker) !== -1) {
					n++;
				}
			});
			return n;
		};

		const assertNoMarkers = function(oResult, label) {
			for (const part of ["diff", "stack"]) {
				for (const marker of ["SAP_POSTPROCESS_REDUCE_START", "SAP_POSTPROCESS_REDUCE_END"]) {
					assert.strictEqual(countMarkers(oResult[part], marker), 0,
						`${label}: ${part} must not contain a ${marker} marker`);
				}
			}
		};

		// Base-heavy shift (e.g. sap_belize): base accumulates one extra banner.
		assertNoMarkers(
			diff(
				postcss.parse("/*! b1 */" + "/*! b2 */" + body("red")),
				postcss.parse("/*! b1 */" + body("blue"))
			),
			"base-heavy"
		);

		// Compare-heavy shift (e.g. sap_belize_plus): compare has one extra banner.
		assertNoMarkers(
			diff(
				postcss.parse("/*! b1 */" + body("red")),
				postcss.parse("/*! b1 */" + "/*! b2 */" + body("blue"))
			),
			"compare-heavy"
		);
	});
});


const convertRuleToComparableString = function(rule) {
	if (rule.type === "comment") {
		return {
			type: rule.type,
			value: rule.text
		};
	} else if (rule.type === "rule") {
		return {
			type: rule.type,
			value: rule.selectors.join(",")
		};
	}
	return {
		type: rule.type,
		value: rule.toString()
	};
};
