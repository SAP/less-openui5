/* eslint-env mocha */
"use strict";

const assert = require("assert");
const readFile = require("./common/helper").readFile;
const fs = require("fs");
const path = require("path");

// tested module
const Builder = require("../").Builder;

describe("(custom fs) CSS Scoping of", function() {
	describe("comments", function() {
		it("should return same CSS for foo", function() {
			return new Builder({
				fs: require("graceful-fs")
			}).build({
				lessInputPath: "comments/themes/foo/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/comments/lib1",
					"test/fixtures/libraries/scopes/comments/lib2",
					"test/fixtures/libraries/lib1"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/comments/lib1/comments/themes/foo/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/comments/lib1/comments/themes/foo/library-RTL.css"), "Rtl CSS scoping should be correctly generated");
			});
		});

		it("should return same CSS for bar", function() {
			let readFileCalls = 0;


			let statCalls = 0;

			return new Builder({
				fs: {
					readFile: function(...args) {
						readFileCalls++;
						return fs.readFile(...args);
					},
					stat: function(...args) {
						statCalls++;
						return fs.stat(...args);
					}
				}
			}).build({
				lessInputPath: "comments/themes/bar/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/comments/lib1",
					"test/fixtures/libraries/scopes/comments/lib2",
					"test/fixtures/libraries/lib1",
					"test/fixtures/libraries/lib2"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/comments/lib2/comments/themes/bar/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/comments/lib2/comments/themes/bar/library-RTL.css"), "Rtl CSS scoping should be correctly generated");
				assert.equal(readFileCalls, 3, "fs.readFile should have been called 3 times");
				assert.equal(statCalls, 19, "fs.stat should have been called 19 times");
			});
		});


		it("should return same CSS for bar with absolute import paths", function() {
			const readFileCalls = [];


			let statCalls = 0;

			return new Builder({
				fs: {
					readFile: function(...args) {
						readFileCalls.push(args[0]);
						return fs.readFile(...args);
					},
					stat: function(...args) {
						statCalls++;
						return fs.stat(...args);
					}
				}
			}).build({
				lessInputPath: "lib3/comments/themes/bar/library.source.less",
				rootPaths: [
					"test/fixtures/libraries/scopes/comments"
				]
			}).then(function(result) {
				assert.equal(result.css, readFile("test/expected/libraries/scopes/comments/lib3/comments/themes/bar/library.css"), "CSS scoping should be correctly generated");
				assert.equal(result.cssRtl, readFile("test/expected/libraries/scopes/comments/lib3/comments/themes/bar/library-RTL.css"), "Rtl CSS scoping should be correctly generated");

				const basePath = path.join("test/fixtures/libraries/scopes/comments/lib3/comments", "themes");
				assert.deepEqual(readFileCalls, [
					path.join(basePath, "bar/library.source.less"),
					path.join(basePath, "other/sub/my.less"),
					path.join(basePath, "bar/my2.less"),
					path.join(basePath, "my3.less")
				], "fs.readFile should have been called with import paths");
				assert.equal(statCalls, 10, "fs.stat should have been called 19 times");
			});
		});
	});
});
