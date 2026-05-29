/* eslint-env mocha */
"use strict";

const assert = require("assert");

// tested module
const {isAbsoluteUrl} = require("../../../lib/plugin/util");

describe("plugin/util#isAbsoluteUrl", function() {
	[
		// Urls carrying a scheme => absolute
		"http://example.com/img/a.png",
		"https://example.com/img/a.png",
		"data:image/png;base64,iVBORw0KGgoAAAAN",
		"mailto:someone@example.com",
		"custom-scheme://x",
		// Leading whitespace before the scheme is trimmed
		"\tdata:image/png;base64,iVBORw0KGgoAAAAN",
		"  data:image/png;base64,iVBORw0KGgoAAAAN",
		// Server-absolute urls => absolute
		"/server/absolute/img.png",
		// Protocol-relative urls have no scheme but start with "/" => absolute
		"//example.com/img/a.png"
	].forEach(function(url) {
		it(`should treat ${JSON.stringify(url)} as absolute`, function() {
			assert.strictEqual(isAbsoluteUrl(url), true);
		});
	});

	[
		// Relative urls => not absolute
		"img/foo.png",
		"chess.png",
		"./img/foo.png",
		"../img/foo.png",
		"",
		// Malformed schemes (scheme must not start with a digit or "+") => treated as relative.
		// url.parse() accepted these loosely; URL.canParse() correctly rejects them.
		"1abc:x",
		"+foo:x"
	].forEach(function(url) {
		it(`should treat ${JSON.stringify(url)} as relative`, function() {
			assert.strictEqual(isAbsoluteUrl(url), false);
		});
	});
});
