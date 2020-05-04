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

// tested module
const less = require("../lib/thirdparty/less");

describe("less", function() {
	it("should inline image as data-uri", (done) => {
		const lessContent =
`body {
  background: data-uri('./fixtures/assets/image.svg');
}
`;

		const expectedCss =
`body {
  background: url("data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjEiIHdpZHRoPSIxIi\
B4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPgo=");
}
`;

		const parser = new less.Parser({
			filename: __filename + ".less" // required to use paths relative to the test file
		});
		parser.parse(lessContent, function(err, tree) {
			if (err) {
				done(err);
				return;
			}

			const css = tree.toCSS();

			assert.equal(css, expectedCss, "CSS should contain inlined image");

			done();
		});
	});
});
