"use strict";

const path = require("path");

module.exports = function(fs) {
	if (!fs) {
		fs = require("fs");
	}

	function statFile(filePath) {
		return new Promise(function(resolve, reject) {
			fs.stat(filePath, function(err, stat) {
				// No rejection here as it is ok if the file was not found
				resolve(stat ? {path: filePath, stat: stat} : null);
			});
		});
	}

	function statFiles(files) {
		return Promise.all(files.map(statFile));
	}

	function findFile(filePath, rootPaths) {
		if (rootPaths && rootPaths.length > 0) {
			return statFiles(
				rootPaths.map(function(rootPath) {
					return path.join(rootPath, filePath);
				})
			).then(function(results) {
				for (let i = 0; i < results.length; i++) {
					if (results[i] !== null) {
						return results[i];
					}
				}

				// File not found
				return null;
			});
		} else {
			return statFile(filePath);
		}
	}

	function readFile(lessInputPath, rootPaths) {
		return findFile(lessInputPath, rootPaths).then(function(fileInfo) {
			if (!fileInfo) {
				return null;
			}
			return new Promise(function(resolve, reject) {
				fs.readFile(fileInfo.path, {
					encoding: "utf8"
				}, function(fileErr, content) {
					if (fileErr) {
						reject(fileErr);
					} else {
						resolve({
							content: content,
							path: fileInfo.path,
							localPath: lessInputPath,
							stats: fileInfo.stats
						});
					}
				});
			});
		});
	}

	return {
		statFile: statFile,
		statFiles: statFiles,
		findFile: findFile,
		readFile: readFile
	};
};
