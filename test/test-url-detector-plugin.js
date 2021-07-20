/* eslint-env mocha */
"use strict";

const assert = require("assert");
const sinon = require("sinon");

const createParser = require("../lib/less/parser");
function parseContent({parserOptions, fnFileHandler, content}) {
	return new Promise(function(resolve, reject) {
		const parser = createParser(parserOptions, fnFileHandler);
		parser.parse(content, function(err, tree) {
			if (err) {
				reject(err);
			} else {
				resolve(tree);
			}
		});
	});
}

// tested module
const UrlDetectorPlugin = require("../lib/plugin/url-detector");

describe("UrlCollectorPlugin", function() {
	// beforeEach(function() {
	// });
	// afterEach(function() {
	// 	sinon.restore();
	// });

	it("should return empty array when there are no urls", async function() {
		const tree = await parseContent({
			content: `
			@myUrlVariable: url(img.png);
			@myPotentialUrlVariable: none;
			@myKeyword: foo bar;
			.foo {
				background-image: @myUrlVariable;
			}
			.bar {
				background-image: @myPotentialUrlVariable;
			}
			`,
			parserOptions: {
				relativeUrls: true,
				filename: "test.less"
			}
		});

		console.log(JSON.stringify(tree, null, 2));

		const urlDetectorPlugin = new UrlDetectorPlugin();

		const css = tree.toCSS({
			plugins: [urlDetectorPlugin]
		});

		assert.deepStrictEqual(urlDetectorPlugin.getUrls(), []);
		assert.strictEqual(css,
			`.foo {
  background-image: url(img.png);
}
.bar {
  background-image: none;
}
`);
	});
});
