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

	function readdirPromise(fileDir) {
		return new Promise(function(resolve, reject) {
			fs.readdir(fileDir, function(err, files) {
				if (err) {
					reject(err);
				} else {
					resolve(files);
				}
			});
		});
	}

	/**
	 *
	 * @param {string} fileDir
	 * @param {string[]} fileExtensions, e.g. [".png"]
	 * @param {string[]} [rootPaths]
	 * @returns {string[]}
	 */
	function findFilesByExtension(fileDir, fileExtensions, rootPaths) {
		if (rootPaths && rootPaths.length > 0) {
			const promises = rootPaths.map((function(rootPath) {
				return findFilesByExtension(path.join(rootPath, fileDir), fileExtensions);
			}));
			return Promise.all(promises).then(function(promiseResults) {
				return [...promiseResults];
			});
		} else {
			let result = [];
			return readdirPromise(fileDir).then(function(dirNames) {
				return Promise.all(dirNames.map(function(dirName) {
					const absPath = path.join(fileDir, dirName);
					return statFile(absPath).then(function(fileStats) {
						if (fileStats.stat.isDirectory()) {
							return findFilesByExtension(absPath, fileExtensions, rootPaths).then(function(nestedResults) {
								result = result.concat(nestedResults);
							});
						} else if (fileStats.stat.isFile()) {
							const matchesExtension = fileExtensions.some(function(fileExtension) {
								return path.extname(fileStats.path).toLowerCase() === fileExtension.toLowerCase();
							});
							if (matchesExtension) {
								result.push(fileStats.path);
							}
						}
					});
				}));
			}).then(function() {
				return result;
			});
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
		findFilesByExtension: findFilesByExtension,
		readFile: readFile
	};
};
