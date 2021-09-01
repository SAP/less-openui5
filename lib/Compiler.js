const path = require("path");
const createParser = require("./less/parser");
const clone = require("clone");

// Plugins
const ImportCollectorPlugin = require("./plugin/import-collector");
const VariableCollectorPlugin = require("./plugin/variable-collector");
const UrlCollector = require("./plugin/url-collector");

class Compiler {
	constructor({options, fileUtils, customFs}) {
		this.options = options;
		this.fileUtils = fileUtils;

		// Stores mapping between "virtual" paths (used within LESS) and real filesystem paths.
		// Only relevant when using the "rootPaths" option.
		this.mFileMappings = {};

		// Only use custom file handler when "rootPaths" or custom "fs" are used
		if ((this.options.rootPaths && this.options.rootPaths.length > 0) || customFs) {
			this.fnFileHandler = this.createFileHandler();
		} else {
			this.fnFileHandler = undefined;
		}
	}
	createFileHandler() {
		return async (file, currentFileInfo, handleDataAndCallCallback, callback) => {
			try {
				let pathname;

				// support absolute paths such as "/resources/my/base.less"
				if (path.posix.isAbsolute(file)) {
					pathname = path.posix.normalize(file);
				} else {
					pathname = path.posix.join(currentFileInfo.currentDirectory, file);
				}

				const result = await this.fileUtils.readFile(pathname, this.options.rootPaths);
				if (!result) {
					// eslint-disable-next-line no-console
					console.log("File not found: " + pathname);
					callback({type: "File", message: "Could not find file at path '" + pathname + "'"});
				} else {
					// Save import mapping to calculate full import paths later on
					this.mFileMappings[currentFileInfo.rootFilename] =
						this.mFileMappings[currentFileInfo.rootFilename] || {};
					this.mFileMappings[currentFileInfo.rootFilename][pathname] = result.path;

					handleDataAndCallCallback(pathname, result.content);
				}
			} catch (err) {
				// eslint-disable-next-line no-console
				console.log(err);
				callback(err);
			}
		};
	}
	async compile(config) {
		const parserOptions = clone(this.options.parser);
		let rootpath;

		if (config.path) {
			// Keep rootpath for later usage in the ImportCollectorPlugin
			rootpath = config.path;
			parserOptions.filename = config.localPath;
		}

		// inject the library name as prefix (e.g. "sap.m" as "_sap_m")
		if (this.options.library && typeof this.options.library.name === "string") {
			const libName = config.libName = this.options.library.name;
			config.libPath = libName.replace(/\./g, "/");
			config.prefix = "_" + libName.replace(/\./g, "_") + "_";
		} else {
			config.prefix = ""; // no library, no prefix
		}

		// Keep filename for later usage (see ImportCollectorPlugin) as less modifies the parserOptions.filename
		const filename = parserOptions.filename;

		const parser = createParser(parserOptions, this.fnFileHandler);

		function parseContent(content) {
			return new Promise(function(resolve, reject) {
				parser.parse(content, function(err, tree) {
					if (err) {
						reject(err);
					} else {
						resolve(tree);
					}
				});
			});
		}

		const tree = await parseContent(config.content);
		const result = {tree};

		// plugins to collect imported files and variable values
		const oImportCollector = new ImportCollectorPlugin({
			importMappings: this.mFileMappings[filename]
		});
		const oVariableCollector = new VariableCollectorPlugin(this.options.compiler);
		const oUrlCollector = new UrlCollector();

		// render to css
		result.css = tree.toCSS(Object.assign({}, this.options.compiler, {
			plugins: [oImportCollector, oVariableCollector, oUrlCollector]
		}));

		// retrieve imported files
		result.imports = oImportCollector.getImports();

		// retrieve reduced set of variables
		result.variables = oVariableCollector.getVariables(Object.keys(this.mFileMappings[filename] || {}));

		// retrieve all variables
		result.allVariables = oVariableCollector.getAllVariables();

		// also compile rtl-version if requested
		let oRTL;
		if (this.options.rtl) {
			const RTLPlugin = require("./plugin/rtl");
			oRTL = new RTLPlugin();

			const urls = oUrlCollector.getUrls();

			const existingImgRtlUrls = (await Promise.all(
				urls.map(async ({currentDirectory, relativeUrl}) => {
					const relativeImgRtlUrl = RTLPlugin.getRtlImgUrl(relativeUrl);
					if (relativeImgRtlUrl) {
						const resolvedImgRtlUrl = path.posix.join(currentDirectory, relativeImgRtlUrl);
						if (await this.fileUtils.findFile(resolvedImgRtlUrl, this.options.rootPaths)) {
							return resolvedImgRtlUrl;
						}
					}
				})
			)).filter(Boolean);

			oRTL.setExistingImgRtlPaths(existingImgRtlUrls);
		}

		if (oRTL) {
			result.cssRtl = tree.toCSS(Object.assign({}, this.options.compiler, {
				plugins: [oRTL]
			}));
		}

		if (rootpath) {
			result.imports.unshift(rootpath);
		}

		// also compile css-variables version if requested
		if (this.options.cssVariables) {
			// parse the content again to have a clean tree
			const cssVariablesSkeletonTree = await parseContent(config.content);

			// generate the skeleton-css and the less-variables
			const CSSVariablesCollectorPlugin = require("./plugin/css-variables-collector");
			const oCSSVariablesCollector = new CSSVariablesCollectorPlugin(config);
			const oVariableCollector = new VariableCollectorPlugin(this.options.compiler);
			result.cssSkeleton = cssVariablesSkeletonTree.toCSS(Object.assign({}, this.options.compiler, {
				plugins: [oCSSVariablesCollector, oVariableCollector]
			}));
			const varsOverride = oVariableCollector.getAllVariables();
			result.cssVariablesSource = oCSSVariablesCollector.toLessVariables(varsOverride);

			if (oRTL) {
				const oCSSVariablesCollectorRTL = new CSSVariablesCollectorPlugin(config);
				result.cssSkeletonRtl = cssVariablesSkeletonTree.toCSS(Object.assign({}, this.options.compiler, {
					plugins: [oCSSVariablesCollectorRTL, oRTL]
				}));
			}

			// generate the css-variables content out of the less-variables
			const cssVariablesTree = await parseContent(result.cssVariablesSource);
			const CSSVariablesPointerPlugin = require("./plugin/css-variables-pointer");
			result.cssVariables = cssVariablesTree.toCSS(Object.assign({}, this.options.compiler, {
				plugins: [new CSSVariablesPointerPlugin()]
			}));
		}

		return result;
	}
}

module.exports = Compiler;
