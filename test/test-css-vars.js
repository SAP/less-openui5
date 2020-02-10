// Copyright 2020 SAP SE.
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
