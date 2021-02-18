/* eslint-env mocha */
"use strict";

const assert = require("assert");
const path = require("path");

// tested module
const fileUtils = require("../lib/fileUtils.js");

describe("fileUtils", function() {
	it("findFilesByExtension", function() {
		// root
		// root/a
		// root/a/afile
		// root/a/b
		// root/a/b/myfile
		// root/a/b/myimg.png
		// root/a/b/mygif.gif
		// root/a/c
		// root/a/c/mycgif.gif


		const fileUtilsInstance = fileUtils({
			stat: function(filePath, fn) {
				fn(false, {
					isDirectory: function() {
						return filePath.endsWith("a") || filePath.endsWith("b") || filePath.endsWith("c");
					},
					isFile: function() {
						return !this.isDirectory();
					}
				});
			},
			readdir: function(filePath, fn) {
				let dirs = [];
				if (filePath.endsWith("root")) {
					dirs = ["a"];
				} if (filePath.endsWith("a")) {
					dirs = ["b", "c", "afile"];
				} else if (filePath.endsWith("b")) {
					dirs = ["myfile.x", "myfile", "myimg.png", "mygif.gif"];
				} else if (filePath.endsWith("c")) {
					dirs = ["mycgif.gif"];
				}
				fn(false, dirs);
			}
		});

		const promises = [];
		promises.push(fileUtilsInstance.findFilesByExtension("root", [".gif"]).then(function(result) {
			assert.deepEqual(result, [
				path.normalize("root/a/b/mygif.gif"),
				path.normalize("root/a/c/mycgif.gif")
			]);
		}));
		promises.push(fileUtilsInstance.findFilesByExtension("root", [".gif", ".png"]).then(function(result) {
			assert.deepEqual(result, [
				path.normalize("root/a/b/myimg.png"),
				path.normalize("root/a/b/mygif.gif"),
				path.normalize("root/a/c/mycgif.gif")
			]);
		}));
		return Promise.all(promises);
	});
});
