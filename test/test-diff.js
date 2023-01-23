/* eslint-env mocha */
"use strict";

const assert = require("assert");
const css = require("@adobe/css-tools");
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
		const oBase = css.parse(baseCSS);
		const oEmbedded = css.parse(compareCSS);

		const oResult = diff(oBase, oEmbedded);

		assert.deepStrictEqual(oResult.diff.stylesheet.rules.map(convertRuleToComparableString), [
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
				"value": " mine "
			},
			{
				"type": "rule",
				"value": "b.test"
			}
		]);
		assert.deepStrictEqual(oResult.stack.stylesheet.rules.map(convertRuleToComparableString), [
			{
				"type": "rule",
				"value": "html"
			},
			{
				"type": "comment",
				"value": " mine2 "
			},
			{
				"type": "comment",
				"value": " single "
			}
		]);
	});
	it("should create a diff with more rules in base than in compare", function() {
		const compareCSS = fs.readFileSync(path.join(cssPath, "library2/compare.css"), options);
		const baseCSS = fs.readFileSync(path.join(cssPath, "library2/base.css"), options);

		// Create diff object between embeddedCompare and embedded
		const oBase = css.parse(baseCSS);
		const oEmbedded = css.parse(compareCSS);

		const oResult = diff(oBase, oEmbedded);

		assert.deepStrictEqual(oResult.diff.stylesheet.rules.map(convertRuleToComparableString), [
			{
				"type": "rule",
				"value": "a"
			},
			{
				"type": "rule",
				"value": "b"
			}
		]);
		assert.deepStrictEqual(oResult.stack.stylesheet.rules.map(convertRuleToComparableString), []);
	});
});


const convertRuleToComparableString = function(rule) {
	if (rule.type === "comment") {
		return {
			type: rule.type,
			value: rule.comment
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
