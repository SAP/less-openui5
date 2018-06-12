// Copyright 2018 SAP SE.
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

'use strict';

var path = require('path');
var assign = require('object-assign');
var clone = require('clone');
var css = require('css');

var createParser = require('./less/parser');
var diff = require('./diff');
var scope = require('./scope');

var fileUtilsFactory = require('./fileUtils');

// Plugins
var RTLPlugin = require('./plugin/rtl');
var ImportCollectorPlugin = require('./plugin/import-collector');
var VariableCollectorPlugin = require('./plugin/variable-collector');

// Workaround for a performance issue in the "css" parser module when used in combination
// with the "colors" module that enhances the String prototype.
// See: https://github.com/reworkcss/css/issues/88
//
// This function removes all properties added by "colors" and returns a function
// that restores them  afterwards.
// To be used before/after calling "css.parse"
function cleanupStringPrototype() {
	var customGetters = {}, customProps = {}, s = "", key;

	for (key in s) {
		if (!s.hasOwnProperty(key)) {
			var getter = String.prototype.__lookupGetter__(key);
			if (typeof getter === "function") {
				customGetters[key] = getter;
			} else {
				customProps[key] = String.prototype[key];
			}
			if (typeof Reflect !== "undefined") {
				Reflect.deleteProperty(String.prototype, key);
			} else {
				delete String.prototype[key];
			}
		}
	}

	return function restore() {
		for (key in customGetters) {
			if (customGetters.hasOwnProperty(key)) {
				String.prototype.__defineGetter__(key, customGetters[key]);
			}
		}
		for (key in customProps) {
			if (customProps.hasOwnProperty(key)) {
				String.prototype[key] = customProps[key];
			}
		}
	}
}

function dotThemingFileToPath(s) {
	if (s.indexOf(".") > -1) {
		s = "../" + s.replace(/\./g, "/");
	}

	return s;
}

var Builder = function(options) {
	this.themeCacheMapping = {};
	this.customFs = options ? options.fs : null;
	this.fileUtils = fileUtilsFactory(this.customFs);
};

Builder.prototype.getThemeCache = function(rootPath) {
	return this.themeCacheMapping[rootPath];
};

Builder.prototype.setThemeCache = function(rootPath, cache) {
	return this.themeCacheMapping[rootPath] = cache;
};

Builder.prototype.clearCache = function() {
	this.themeCacheMapping = {};
}

Builder.prototype.cacheTheme = function(result) {
	var that = this;
	var rootpath;

	// Theme can only be cached if list of imports is available
	if (result.imports.length === 0) {
		return Promise.resolve(result);
	}

	// Rootpath of theme is always the first entry
	rootpath = result.imports[0];

	return that.fileUtils.statFiles(result.imports).then(function(stats) {
		that.setThemeCache(rootpath, {
			result: result,
			stats: stats
		});

		return result;
	});

};

Builder.prototype.build = function(options) {
	var that = this;

	// Stores mapping between "virtual" paths (used within LESS) and real filesystem paths.
	// Only relevant when using the "rootPaths" option.
	var mFileMappings = {};

	// Assign default options
	options = assign({
		lessInput: null,
		lessInputPath: null,
		rtl: true,
		rootPaths: [],
		parser: {},
		compiler: {},
		library: {},
		scope: {}
	}, options);

	// Set default of "relativeUrls" parser option to "true" (less default is "false")
	if (!options.parser.hasOwnProperty("relativeUrls")) {
		options.parser.relativeUrls = true;
	}

	function fileHandler(file, currentFileInfo, handleDataAndCallCallback, callback) {

		var pathname = path.posix.join(currentFileInfo.currentDirectory, file);

		that.fileUtils.readFile(pathname, options.rootPaths).then(function(result) {
			if (!result) {
				console.log("File not found");
				callback({ type: 'File', message: "'" + file + "' wasn't found" })
			} else {

				try {
					// Save import mapping to calculate full import paths later on
					mFileMappings[currentFileInfo.rootFilename] = mFileMappings[currentFileInfo.rootFilename] || {};
					mFileMappings[currentFileInfo.rootFilename][pathname] = result.path;

					handleDataAndCallCallback(pathname, result.content);
				} catch (e) {
					console.log(e);
					callback(e);
				}

			}
		}, function(err) {
			console.log(err);
			callback(err);
		});
	}

	function compile(config) {
		var parserOptions = clone(options.parser);
		var rootpath;

		if (config.path) {
			// Keep rootpath for later usage in the ImportCollectorPlugin
			rootpath = config.path;
			parserOptions.filename = config.localPath;
		}

		// Keep filename for later usage (see ImportCollectorPlugin) as less modifies the parserOptions.filename
		var filename = parserOptions.filename;

		// Only use custom file handler when "rootPaths" or custom "fs" are used
		var fnFileHandler;
		if ((options.rootPaths && options.rootPaths.length > 0) || that.customFs) {
			fnFileHandler = fileHandler;
		}

		return new Promise(function(resolve, reject) {
			var parser = createParser(parserOptions, fnFileHandler);
			parser.parse(config.content, function(err, tree) {

				if (err) {
					reject(err);
				} else {
					resolve(tree);
				}
			});
		}).then(function(tree) {

			var result = {};

			result.tree = tree;

			// plugins to collect imported files and variable values
			var oImportCollector = new ImportCollectorPlugin({
				importMappings: mFileMappings[filename]
			});
			var oVariableCollector = new VariableCollectorPlugin(options.compiler);

			// render to css
			result.css = tree.toCSS(assign(options.compiler, {
				plugins: [ oImportCollector, oVariableCollector ]
			}));

			// retrieve imported files
			result.imports = oImportCollector.getImports();

			// retrieve reduced set of variables
			result.variables = oVariableCollector.getVariables(Object.keys(mFileMappings[filename] || {}));

			// retrieve all variables
			result.allVariables = oVariableCollector.getAllVariables();

			// also compile rtl-version if requested
			if (options.rtl) {
				result.cssRtl = tree.toCSS(assign(options.compiler, {
					plugins: [ new RTLPlugin() ]
				}));
			}

			if (rootpath) {
				result.imports.unshift(rootpath);
			}

			return result;

		});
	}

	function addInlineParameters(result) {
		return new Promise(function(resolve, reject) {
			if (typeof options.library === "object" && typeof options.library.name === "string") {
				var parameters = JSON.stringify(result.variables);

				// escape all chars that could cause problems with css parsers using URI-Encoding (% + HEX-Code)
				var escapedChars = "%{}()'\"\\";
				for (var i = 0; i < escapedChars.length; i++) {
					var char = escapedChars.charAt(i);
					var hex = char.charCodeAt(0).toString(16).toUpperCase();
					parameters = parameters.replace(new RegExp("\\" + char, "g"), "%" + hex);
				}

				var parameterStyleRule =
					"\n/* Inline theming parameters */\n#sap-ui-theme-" +
					options.library.name.replace(/\./g, "\\.") +
					" { background-image: url('data:text/plain;utf-8," + parameters + "'); }\n";

				// embed parameter variables as plain-text string into css
				result.css += parameterStyleRule;
				if (result.cssRtl) {
					result.cssRtl += parameterStyleRule;
				}
			}
			resolve(result);
		});
	}

	function getScopeVariables(options) {
		var sScopeName = options.scopeName;
		var oVariablesBase = options.baseVariables;
		var oVariablesEmbedded = options.embeddedVariables;
		var oVariablesDiff = {};

		for (var sKey in oVariablesEmbedded) {
			if (sKey in oVariablesBase) {
				if (oVariablesBase[sKey] != oVariablesEmbedded[sKey]) {
					oVariablesDiff[sKey] = oVariablesEmbedded[sKey];
				}
			}
		}

		// Merge variables
		var oVariables = {};
		oVariables["default"] = oVariablesBase;
		oVariables["scopes"] = {};
		oVariables["scopes"][sScopeName] = oVariablesDiff;

		return oVariables;
	}

	function compileWithScope(scopeOptions) {
		// 1. Compile base + embedded files (both default + RTL variants)
		return Promise.all([
			that.fileUtils.readFile(scopeOptions.embeddedCompareFilePath, options.rootPaths).then(compile),
			that.fileUtils.readFile(scopeOptions.embeddedFilePath, options.rootPaths).then(compile)
		]).then(function(results) {
			return {
				embeddedCompare: results[0],
				embedded: results[1]
			};
		}).then(function(results) {
			var sScopeName = scopeOptions.selector;

			function applyScope(embeddedCompareCss, embeddedCss, bRtl) {

				var restoreStringPrototype = cleanupStringPrototype();

				// Create diff object between embeddedCompare and embedded
				var oBase = css.parse(embeddedCompareCss);
				var oEmbedded = css.parse(embeddedCss);

				restoreStringPrototype();

				var oDiff = diff(oBase, oEmbedded);

				// Create scope
				var sScopeSelector = '.' + sScopeName;
				var oScope = scope(oDiff.diff, sScopeSelector);

				var oCssScopeRoot;

				if (oDiff.stack) {
					oCssScopeRoot = scope.scopeCssRoot(oDiff.stack.stylesheet.rules, sScopeName);

					if (oCssScopeRoot) {
						oScope.stylesheet.rules.unshift(oCssScopeRoot);
					}
				}

				// Append scope + stack to embeddedCompareFile (actually target file, which is currently always the same i.e. "library.css")
				// The stack gets appended to the embeddedFile only
				var sAppend = css.stringify(oScope, {
					compress: options.compiler && options.compiler.compress === true
				});

				if (scopeOptions.baseFilePath !== options.lessInputPath && oDiff.stack && oDiff.stack.stylesheet.rules.length > 0) {
					sAppend += "\n" + css.stringify(oDiff.stack, {
						compress: options.compiler && options.compiler.compress === true
					});
				}

				return sAppend + "\n";

			}

			results.embeddedCompare.css += applyScope(results.embeddedCompare.css, results.embedded.css);
			if (options.rtl) {
				results.embeddedCompare.cssRtl += applyScope(results.embeddedCompare.cssRtl, results.embedded.cssRtl, true);
			}

			// Create diff between embeddedCompare and embeded variables
			results.embeddedCompare.variables = getScopeVariables({
				baseVariables: results.embeddedCompare.variables,
				embeddedVariables: results.embedded.variables,
				scopeName: sScopeName
			});
			results.embeddedCompare.allVariables = getScopeVariables({
				baseVariables: results.embeddedCompare.allVariables,
				embeddedVariables: results.embedded.allVariables,
				scopeName: sScopeName
			});

			var concatImports = function(aImportsBase, aImportsEmbedded) {
				var aConcats = aImportsBase.concat(aImportsEmbedded);

				return aConcats.filter(function(sImport, sIndex) {
					return aConcats.indexOf(sImport) == sIndex;
				})
			};

			if (scopeOptions.baseFilePath !==  options.lessInputPath) {
				results.embeddedCompare.imports = concatImports(results.embedded.imports, results.embeddedCompare.imports);
			} else {
				results.embeddedCompare.imports = concatImports(results.embeddedCompare.imports, results.embedded.imports);
			}

			// 6. Resolve promise with complete result object (css, cssRtl, variables, imports)
			return results.embeddedCompare;

		});
	}


	function readDotTheming(dotThemingInputPath) {
		return that.fileUtils.readFile(dotThemingInputPath, options.rootPaths).then(function(result) {

			var dotTheming;
			var dotThemingFilePath;

			if (result) {
				dotTheming = JSON.parse(result.content);
				dotThemingFilePath = result.path;
			}

			if (dotTheming && dotTheming.mCssScopes) {

				// Currently only the "library" target is supported
				var cssScope = dotTheming.mCssScopes["library"];

				if (cssScope) {

					var aScopes = cssScope.aScopes;
					var oScopeConfig = aScopes[0]; // Currenlty only one scope is supported

					var sBaseFile = dotThemingFileToPath(cssScope.sBaseFile || cssScopeTarget);
					var sEmbeddedCompareFile = dotThemingFileToPath(oScopeConfig.sEmbeddedCompareFile);
					var sEmbeddedFile = dotThemingFileToPath(oScopeConfig.sEmbeddedFile);

					// Currently, only support the use case when "sBaseFile" equals "sEmbeddedCompareFile"
					if (sBaseFile !== sEmbeddedCompareFile) {
						throw new Error("Unsupported content in \"" + dotThemingInputPath + "\": " +
							"\"sBaseFile\" (\"" + (cssScope.sBaseFile || cssScopeTarget) + "\") must be identical with " +
							"\"sEmbeddedCompareFile\" (\"" + oScopeConfig.sEmbeddedCompareFile + "\")");
					}

					var baseFilePath = path.posix.join(themeDir, sBaseFile) + '.source.less';
					var embeddedCompareFilePath = path.posix.join(themeDir, sEmbeddedCompareFile) + '.source.less';
					var embeddedFilePath = path.posix.join(themeDir, sEmbeddedFile) + '.source.less';

					// 1. Compile base + embedded files (both default + RTL variants)
					return compileWithScope({
						selector: oScopeConfig.sSelector,
						embeddedFilePath: embeddedFilePath,
						embeddedCompareFilePath: embeddedCompareFilePath,
						baseFilePath: baseFilePath
					}).then(function(embeddedCompare) {
						embeddedCompare.imports.push(dotThemingFilePath);
						return embeddedCompare;
					});
				}
			}

			// No css diffing and scoping
			return that.fileUtils.readFile(options.lessInputPath, options.rootPaths).then(compile);
		});
	}

	if (options.lessInput && options.lessInputPath) {
		return Promise.reject(new Error("Please only provide either `lessInput` or `lessInputPath` but not both."));
	}

	if (!options.lessInput && !options.lessInputPath) {
		return Promise.reject(new Error("Missing required option. Please provide either `lessInput` or `lessInputPath`."));
	}

	if (options.lessInput) {

		return compile({
			content: options.lessInput
		}).then(addInlineParameters).then(that.cacheTheme.bind(that));

	} else {
		var themeDir = path.posix.dirname(options.lessInputPath);

		// Always use the sap/ui/core library to lookup .theming files
		var coreThemeDir;

		if (options.library && typeof options.library.name === "string") {
			var libraryNamespace = options.library.name.replace(/\./g, "/");
			coreThemeDir =  themeDir.replace(libraryNamespace, "sap/ui/core");
		} else {
			coreThemeDir = themeDir.replace(/^.*\/themes\//, "/sap/ui/core/themes/");
		}

		var dotThemingInputPath = path.posix.join(coreThemeDir, '.theming');

		return that.fileUtils.findFile(options.lessInputPath, options.rootPaths).then(function(fileInfo) {

			if (!fileInfo) {
				throw new Error("`lessInputPath` " + options.lessInputPath + " could not be found.");
			}

			// check theme has been already cached
			var themeCache;
			if (fileInfo.path) {
				themeCache = that.getThemeCache(fileInfo.path);
			}

			var scopeOptions = options.scope;

			// Compile theme if not cached or RTL is requested and missing in cache
			if (!themeCache || (options.rtl && !themeCache.result.cssRtl)) {
				if (scopeOptions.selector && scopeOptions.embeddedFilePath && scopeOptions.embeddedCompareFilePath && scopeOptions.baseFilePath) {
					return compileWithScope(scopeOptions).then(addInlineParameters).then(that.cacheTheme.bind(that));
				}
				return readDotTheming(dotThemingInputPath).then(addInlineParameters).then(that.cacheTheme.bind(that));
			} else {
				return that.fileUtils.statFiles(themeCache.result.imports).then(function(newStats) {
					for (var i = 0; i < newStats.length; i++) {
						// check if .theming and less files have changed since last less compilation
						if (!newStats[i] || newStats[i].stat.mtime.getTime() !== themeCache.stats[i].stat.mtime.getTime()) {
							if (scopeOptions.selector && scopeOptions.embeddedFilePath && scopeOptions.embeddedCompareFilePath && scopeOptions.baseFilePath) {
								return compileWithScope(scopeOptions).then(addInlineParameters).then(that.cacheTheme.bind(that));
							}
							return readDotTheming(dotThemingInputPath).then(addInlineParameters).then(that.cacheTheme.bind(that));
						}
					}

					// serve from cache
					return themeCache.result;
				});
			}
		});
	}
};

module.exports.Builder = Builder;
