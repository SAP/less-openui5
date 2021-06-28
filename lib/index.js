"use strict";

const path = require("path");
const clone = require("clone");
const css = require("css");

const createParser = require("./less/parser");
const diff = require("./diff");
const scope = require("./scope");

const fileUtilsFactory = require("./fileUtils");

// Plugins
const ImportCollectorPlugin = require("./plugin/import-collector");
const VariableCollectorPlugin = require("./plugin/variable-collector");
const UrlCollector = require("./plugin/url-collector");

// Workaround for a performance issue in the "css" parser module when used in combination
// with the "colors" module that enhances the String prototype.
// See: https://github.com/reworkcss/css/issues/88
//
// This function removes all properties added by "colors" and returns a function
// that restores them  afterwards.
// To be used before/after calling "css.parse"
function cleanupStringPrototype() {
	const customGetters = {}; const customProps = {}; const s = ""; let key;

	for (key in s) {
		if (!Object.prototype.hasOwnProperty.call(s, key)) {
			const getter = String.prototype.__lookupGetter__(key);
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
			if (Object.prototype.hasOwnProperty.call(customGetters, key)) {
				String.prototype.__defineGetter__(key, customGetters[key]);
			}
		}
		for (key in customProps) {
			if (Object.prototype.hasOwnProperty.call(customProps, key)) {
				// eslint-disable-next-line no-extend-native
				String.prototype[key] = customProps[key];
			}
		}
	};
}

function dotThemingFileToPath(s) {
	if (s.indexOf(".") > -1) {
		s = "../" + s.replace(/\./g, "/");
	}

	return s;
}

const Builder = function(options) {
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
};

Builder.prototype.cacheTheme = function(result) {
	const that = this;

	// Theme can only be cached if list of imports is available
	if (result.imports.length === 0) {
		return Promise.resolve(result);
	}

	// Rootpath of theme is always the first entry
	const rootpath = result.imports[0];

	return that.fileUtils.statFiles(result.imports).then(function(stats) {
		that.setThemeCache(rootpath, {
			result: result,
			stats: stats
		});

		return result;
	});
};

/**
 * Creates a themebuild
 * @param {object} options
 * @param {object} options.compiler compiler object as passed to less
 * @param {boolean} options.cssVariables whether or not to enable css variables output
 * @param {string} options.lessInput less string input
 * @param {string} options.lessInputPath less file input
 * @returns {{css: string, cssRtl: string, variables: {}, imports: [], cssSkeleton: string, cssSkeletonRtl: string, cssVariables: string, cssVariablesSource: string }}
 */
Builder.prototype.build = function(options) {
	const that = this;

	// Stores mapping between "virtual" paths (used within LESS) and real filesystem paths.
	// Only relevant when using the "rootPaths" option.
	const mFileMappings = {};

	// Assign default options
	options = Object.assign({
		lessInput: null,
		lessInputPath: null,
		rtl: true,
		rootPaths: [],
		parser: {},
		compiler: {},
		library: {},
		scope: {}
	}, options);

	if (options.compiler.sourceMap) {
		return Promise.reject(new Error("compiler.sourceMap option is not supported!"));
	}
	if (options.compiler.cleancss) {
		return Promise.reject(new Error("compiler.cleancss option is not supported! Please use 'clean-css' directly."));
	}

	// Set default of "relativeUrls" parser option to "true" (less default is "false")
	if (!Object.prototype.hasOwnProperty.call(options.parser, "relativeUrls")) {
		options.parser.relativeUrls = true;
	}

	function fileHandler(file, currentFileInfo, handleDataAndCallCallback, callback) {
		let pathname;

		// support absolute paths such as "/resources/my/base.less"
		if (path.posix.isAbsolute(file)) {
			pathname = path.posix.normalize(file);
		} else {
			pathname = path.posix.join(currentFileInfo.currentDirectory, file);
		}

		that.fileUtils.readFile(pathname, options.rootPaths).then(function(result) {
			if (!result) {
				// eslint-disable-next-line no-console
				console.log("File not found: " + pathname);
				callback({type: "File", message: "Could not find file at path '" + pathname + "'"});
			} else {
				try {
					// Save import mapping to calculate full import paths later on
					mFileMappings[currentFileInfo.rootFilename] = mFileMappings[currentFileInfo.rootFilename] || {};
					mFileMappings[currentFileInfo.rootFilename][pathname] = result.path;

					handleDataAndCallCallback(pathname, result.content);
				} catch (e) {
					// eslint-disable-next-line no-console
					console.log(e);
					callback(e);
				}
			}
		}, function(err) {
			// eslint-disable-next-line no-console
			console.log(err);
			callback(err);
		});
	}

	function compile(config) {
		const parserOptions = clone(options.parser);
		let rootpath;

		if (config.path) {
			// Keep rootpath for later usage in the ImportCollectorPlugin
			rootpath = config.path;
			parserOptions.filename = config.localPath;
		}

		// inject the library name as prefix (e.g. "sap.m" as "_sap_m")
		if (options.library && typeof options.library.name === "string") {
			const libName = config.libName = options.library.name;
			config.libPath = libName.replace(/\./g, "/");
			config.prefix = "_" + libName.replace(/\./g, "_") + "_";
		} else {
			config.prefix = ""; // no library, no prefix
		}

		// Keep filename for later usage (see ImportCollectorPlugin) as less modifies the parserOptions.filename
		const filename = parserOptions.filename;

		// Only use custom file handler when "rootPaths" or custom "fs" are used
		let fnFileHandler;
		if ((options.rootPaths && options.rootPaths.length > 0) || that.customFs) {
			fnFileHandler = fileHandler;
		}

		const parser = createParser(parserOptions, fnFileHandler);

		return new Promise(function(resolve, reject) {
			parser.parse(config.content, function(err, tree) {
				if (err) {
					reject(err);
				} else {
					resolve(tree);
				}
			});
		}).then(async function(tree) {
			const result = {};

			result.tree = tree;

			// plugins to collect imported files and variable values
			const oImportCollector = new ImportCollectorPlugin({
				importMappings: mFileMappings[filename]
			});
			const oVariableCollector = new VariableCollectorPlugin(options.compiler);
			const oUrlCollector = new UrlCollector();

			// render to css
			result.css = tree.toCSS(Object.assign({}, options.compiler, {
				plugins: [oImportCollector, oVariableCollector, oUrlCollector]
			}));

			// retrieve imported files
			result.imports = oImportCollector.getImports();

			// retrieve reduced set of variables
			result.variables = oVariableCollector.getVariables(Object.keys(mFileMappings[filename] || {}));

			// retrieve all variables
			result.allVariables = oVariableCollector.getAllVariables();

			// also compile rtl-version if requested
			let oRTL;
			if (options.rtl) {
				const RTLPlugin = require("./plugin/rtl");
				oRTL = new RTLPlugin();

				const urls = oUrlCollector.getUrls();

				const existingImgRtlUrls = (await Promise.all(
					urls.map(async ({currentDirectory, relativeUrl}) => {
						const relativeImgRtlUrl = RTLPlugin.getRtlImgUrl(relativeUrl);
						if (relativeImgRtlUrl) {
							const resolvedImgRtlUrl = path.posix.join(currentDirectory, relativeImgRtlUrl);
							if (await that.fileUtils.findFile(resolvedImgRtlUrl, options.rootPaths)) {
								return resolvedImgRtlUrl;
							}
						}
					})
				)).filter(Boolean);

				oRTL.setExistingImgRtlPaths(existingImgRtlUrls);
			}

			if (oRTL) {
				result.cssRtl = tree.toCSS(Object.assign({}, options.compiler, {
					plugins: [oRTL]
				}));
			}

			if (rootpath) {
				result.imports.unshift(rootpath);
			}

			// also compile css-variables version if requested
			if (options.cssVariables) {
				return new Promise(function(resolve, reject) {
					// parse the content again to have a clean tree
					parser.parse(config.content, function(err, tree) {
						if (err) {
							reject(err);
						} else {
							resolve(tree);
						}
					});
				}).then(function(tree) {
					// generate the skeleton-css and the less-variables
					const CSSVariablesCollectorPlugin = require("./plugin/css-variables-collector");
					const oCSSVariablesCollector = new CSSVariablesCollectorPlugin(config);
					const oVariableCollector = new VariableCollectorPlugin(options.compiler);
					result.cssSkeleton = tree.toCSS(Object.assign({}, options.compiler, {
						plugins: [oCSSVariablesCollector, oVariableCollector]
					}));
					const varsOverride = oVariableCollector.getAllVariables();
					result.cssVariablesSource = oCSSVariablesCollector.toLessVariables(varsOverride);
					if (oRTL) {
						const oCSSVariablesCollectorRTL = new CSSVariablesCollectorPlugin(config);
						result.cssSkeletonRtl = tree.toCSS(Object.assign({}, options.compiler, {
							plugins: [oCSSVariablesCollectorRTL, oRTL]
						}));
					}
					return tree;
				}).then(function(tree) {
					// generate the css-variables content out of the less-variables
					return new Promise(function(resolve, reject) {
						parser.parse(result.cssVariablesSource, function(err, tree) {
							if (err) {
								reject(err);
							} else {
								const CSSVariablesPointerPlugin = require("./plugin/css-variables-pointer");
								result.cssVariables = tree.toCSS(Object.assign({}, options.compiler, {
									plugins: [new CSSVariablesPointerPlugin()]
								}));
								resolve(result);
							}
						});
					});
				});
			}

			return result;
		});
	}

	function addInlineParameters(result) {
		return new Promise(function(resolve, reject) {
			if (typeof options.library === "object" && typeof options.library.name === "string") {
				const parameters = JSON.stringify(result.variables);

				// properly escape the parameters to be part of a data-uri
				// + escaping single quote (') as it is used to surround the data-uri: url('...')
				const escapedParameters = encodeURIComponent(parameters).replace(/'/g, function(char) {
					return escape(char);
				});

				// embed parameter variables as plain-text string into css
				const parameterStyleRule = "\n/* Inline theming parameters */\n#sap-ui-theme-" +
					options.library.name.replace(/\./g, "\\.") +
					"{background-image:url('data:text/plain;utf-8," + escapedParameters + "')}\n";

				// embed parameter variables as plain-text string into css
				result.css += parameterStyleRule;
				if (options.rtl) {
					result.cssRtl += parameterStyleRule;
				}
				if (options.cssVariables) {
					// for the css variables build we just add it to the variables
					result.cssVariables += parameterStyleRule;
				}
			}
			resolve(result);
		});
	}

	function getScopeVariables(options) {
		const sScopeName = options.scopeName;
		const oVariablesBase = options.baseVariables;
		const oVariablesEmbedded = options.embeddedVariables;
		const oVariablesDiff = {};

		for (const sKey in oVariablesEmbedded) {
			if (sKey in oVariablesBase) {
				if (oVariablesBase[sKey] != oVariablesEmbedded[sKey]) {
					oVariablesDiff[sKey] = oVariablesEmbedded[sKey];
				}
			}
		}

		// Merge variables
		const oVariables = {};
		oVariables["default"] = oVariablesBase;
		oVariables["scopes"] = {};
		oVariables["scopes"][sScopeName] = oVariablesDiff;

		return oVariables;
	}

	function compileWithScope(scopeOptions) {
		// 1. Compile base + embedded files (both default + RTL variants)
		return Promise.all([
			that.fileUtils.readFile(scopeOptions.embeddedCompareFilePath, options.rootPaths).then(function(config) {
				if (!config) {
					throw new Error("Could not find embeddedCompareFile at path '" + scopeOptions.embeddedCompareFilePath + "'");
				}
				return compile(config);
			}),
			that.fileUtils.readFile(scopeOptions.embeddedFilePath, options.rootPaths).then(function(config) {
				if (!config) {
					throw new Error("Could not find embeddedFile at path '" + scopeOptions.embeddedFilePath + "'");
				}
				return compile(config);
			})
		]).then(function(results) {
			return {
				embeddedCompare: results[0],
				embedded: results[1]
			};
		}).then(function(results) {
			const sScopeName = scopeOptions.selector;

			function applyScope(embeddedCompareCss, embeddedCss, bRtl) {
				const restoreStringPrototype = cleanupStringPrototype();

				// Create diff object between embeddedCompare and embedded
				const oBase = css.parse(embeddedCompareCss);
				const oEmbedded = css.parse(embeddedCss);

				restoreStringPrototype();

				const oDiff = diff(oBase, oEmbedded);

				// Create scope
				const sScopeSelector = "." + sScopeName;
				const oScope = scope(oDiff.diff, sScopeSelector);

				let oCssScopeRoot;

				if (oDiff.stack) {
					oCssScopeRoot = scope.scopeCssRoot(oDiff.stack.stylesheet.rules, sScopeName);

					if (oCssScopeRoot) {
						oScope.stylesheet.rules.unshift(oCssScopeRoot);
					}
				}

				// Append scope + stack to embeddedCompareFile (actually target file, which is currently always the same i.e. "library.css")
				// The stack gets appended to the embeddedFile only
				let sAppend = css.stringify(oScope, {
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

			if (options.cssVariables) {
				results.embeddedCompare.cssVariables += applyScope(results.embeddedCompare.cssVariables, results.embedded.cssVariables);
				results.embeddedCompare.cssSkeleton += applyScope(results.embeddedCompare.cssSkeleton, results.embedded.cssSkeleton);
				if (options.rtl) {
					results.embeddedCompare.cssSkeletonRtl += applyScope(results.embeddedCompare.cssSkeletonRtl, results.embedded.cssSkeletonRtl, true);
				}
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

			const concatImports = function(aImportsBase, aImportsEmbedded) {
				const aConcats = aImportsBase.concat(aImportsEmbedded);

				return aConcats.filter(function(sImport, sIndex) {
					return aConcats.indexOf(sImport) == sIndex;
				});
			};

			if (scopeOptions.baseFilePath !== options.lessInputPath) {
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
			let dotTheming;
			let dotThemingFilePath;

			if (result) {
				dotTheming = JSON.parse(result.content);
				dotThemingFilePath = result.path;
			}

			if (dotTheming && dotTheming.mCssScopes) {
				// Currently only the "library" target is supported
				const cssScope = dotTheming.mCssScopes["library"];

				if (cssScope) {
					const aScopes = cssScope.aScopes;
					const oScopeConfig = aScopes[0]; // Currenlty only one scope is supported

					const sBaseFile = dotThemingFileToPath(cssScope.sBaseFile);
					const sEmbeddedCompareFile = dotThemingFileToPath(oScopeConfig.sEmbeddedCompareFile);
					const sEmbeddedFile = dotThemingFileToPath(oScopeConfig.sEmbeddedFile);

					// Currently, only support the use case when "sBaseFile" equals "sEmbeddedCompareFile"
					if (sBaseFile !== sEmbeddedCompareFile) {
						throw new Error("Unsupported content in \"" + dotThemingInputPath + "\": " +
							"\"sBaseFile\" (\"" + cssScope.sBaseFile + "\") must be identical with " +
							"\"sEmbeddedCompareFile\" (\"" + oScopeConfig.sEmbeddedCompareFile + "\")");
					}

					const baseFilePath = path.posix.join(themeDir, sBaseFile) + ".source.less";
					const embeddedCompareFilePath = path.posix.join(themeDir, sEmbeddedCompareFile) + ".source.less";
					const embeddedFilePath = path.posix.join(themeDir, sEmbeddedFile) + ".source.less";

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
		// TODO: refactor
		// eslint-disable-next-line no-var
		var themeDir = path.posix.dirname(options.lessInputPath);

		// Always use the sap/ui/core library to lookup .theming files
		let coreThemeDir;

		if (options.library && typeof options.library.name === "string") {
			const libraryNamespace = options.library.name.replace(/\./g, "/");
			coreThemeDir = themeDir.replace(libraryNamespace, "sap/ui/core");
		} else {
			coreThemeDir = themeDir.replace(/^.*\/themes\//, "/sap/ui/core/themes/");
		}

		const dotThemingInputPath = path.posix.join(coreThemeDir, ".theming");

		return that.fileUtils.findFile(options.lessInputPath, options.rootPaths).then(function(fileInfo) {
			if (!fileInfo) {
				throw new Error("`lessInputPath` " + options.lessInputPath + " could not be found.");
			}

			// check theme has been already cached
			let themeCache;
			if (fileInfo.path) {
				themeCache = that.getThemeCache(fileInfo.path);
			}

			const scopeOptions = options.scope;

			// Compile theme if not cached or RTL is requested and missing in cache
			if (!themeCache || (options.rtl && !themeCache.result.cssRtl)) {
				if (scopeOptions.selector && scopeOptions.embeddedFilePath && scopeOptions.embeddedCompareFilePath && scopeOptions.baseFilePath) {
					return compileWithScope(scopeOptions).then(addInlineParameters).then(that.cacheTheme.bind(that));
				}
				return readDotTheming(dotThemingInputPath).then(addInlineParameters).then(that.cacheTheme.bind(that));
			} else {
				return that.fileUtils.statFiles(themeCache.result.imports).then(function(newStats) {
					for (let i = 0; i < newStats.length; i++) {
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
