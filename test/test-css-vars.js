/* eslint-env mocha */
"use strict";

const assert = require("assert");
const readFile = require("./common/helper").readFile;

// tested module
const Builder = require("../").Builder;

describe("css vars", function() {
	it("should generate the correct css variables in a simple scenario", function() {
		return new Builder().build({
			lessInput: readFile("test/fixtures/simple/test.less"),
			cssVariables: true
		}).then(function(result) {
			assert.equal(result.css, readFile("test/expected/simple/test.css"), "css should be correctly generated.");
			assert.equal(result.cssSkeleton, readFile("test/expected/simple/test-cssvars-skeleton.css"),
				"css should be correctly generated.");
			assert.equal(result.cssVariables, readFile("test/expected/simple/test-cssvars-variables.css"),
				"css variables should be correctly generated.");
		});
	});

	it("should generate the correct css variables in a complex scenario", function() {
		return new Builder().build({
			lessInput: readFile("test/fixtures/complex/test.less"),
			cssVariables: true
		}).then(function(result) {
			assert.equal(result.css, readFile("test/expected/complex/test.css"), "css should be correctly generated.");
			assert.equal(result.cssSkeleton, readFile("test/expected/complex/test-cssvars-skeleton.css"),
				"css should be correctly generated.");
			assert.equal(result.cssVariables, readFile("test/expected/complex/test-cssvars-variables.css"),
				"css variables should be correctly generated.");
		});
	});
});
