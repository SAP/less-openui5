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
const readFile = require("./common/helper").readFile;

// tested module
const Builder = require("../").Builder;

describe("minification", function() {
	it("minify", function() {
		return new Builder().build({
			lessInput: readFile("test/fixtures/minification/test.less"),
			compiler: {
				compress: true
			}
		}).then(function(result) {
			assert.equal(result.css, readFile("test/expected/minification/test.css"), "css should be correctly generated.");
		}, function(err) {
			console.error(err);
		});
	});
});
