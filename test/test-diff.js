// Copyright 2019 SAP SE.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http: //www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
// either express or implied. See the License for the specific
// language governing permissions and limitations under the License.

/* eslint-env mocha */
"use strict";

const assert = require("assert");
const css = require("css");
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
