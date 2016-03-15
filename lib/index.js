// Copyright 2016 SAP SE.
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

var less = require('less');
var path = require('path');
var assign = require('object-assign');

// Plugins
var RTLPlugin = require('./plugin/rtl');
var ImportCollectorPlugin = require('./plugin/import-collector');
var VariableCollectorPlugin = require('./plugin/variable-collector');

/**
 * Compiles the input string to CSS using the less compiler.
 *
 * @param {String} input Input less content
 * @param {Object} options An object with build options
 * @param {Function} callback Function to call when finished.
 */
module.exports.build = function(input, options, callback) {

	// normalize arguments (no options)
	if (typeof options === 'function') {
		callback = options;
		options = {};
	}

	options = assign({
		rtl: true,
		rootPaths: [],
		parser: {},
		compiler: {},
		library: {}
	}, options);

    // Set default of "relativeUrls" parser option to "true" (less default is "false")
    if (!options.parser.hasOwnProperty("relativeUrls")) {
        options.parser.relativeUrls = true;
    }

	var result = {
		variables: {},
		css: '',
		tree: null
	};

	var rootPathsMapping = {};

	// Keep reference of original less function
	var fnFileLoader = less.Parser.fileLoader;
	less.Parser.fileLoader = function fileLoaderHook(file, currentFileInfo, fn, env) {
		var paths = rootPathsMapping[currentFileInfo.currentDirectory];
		if (typeof paths === 'undefined') {
			var base = options.rootPaths.filter(function(p) {
				p = path.normalize(p);
				return path.normalize(currentFileInfo.currentDirectory).substr(0, p.length) === p;
			})[0];
			if (base) {
				var suffix = path.relative(base, currentFileInfo.currentDirectory);
				paths = options.rootPaths.map(function(p) {
					return path.join(p, suffix);
				});
			} else {
				paths = null; // set paths to null to identify if dir has already been checked
			}
			rootPathsMapping[currentFileInfo.currentDirectory] = paths;
		}
		if (paths) {
			env.paths = paths;
		} else if (options.parser.paths) {
			env.paths = options.parser.paths;
		}
		return fnFileLoader.apply(this, arguments);
	};

	var parser = new less.Parser(options.parser);

	parser.parse(input, function(err, tree) {

		// restore fileLoader function
		less.Parser.fileLoader = fnFileLoader;

		result.tree = tree;

		if (!err) {

			try {

				// plugins to collect imported files and variable values
				var oImportCollector = new ImportCollectorPlugin();
				var oVariableCollector = new VariableCollectorPlugin();

				// render to css
				result.css = tree.toCSS(assign(options.compiler, {
					plugins: [ oImportCollector, oVariableCollector ]
				}));

				// retrieve imported files
				result.imports = oImportCollector.getImports();
				result.variables = oVariableCollector.getVariables();

				// also compile rtl-version if requested
				if (options.rtl) {
					result.cssRtl = tree.toCSS(assign(options.compiler, {
						plugins: [ new RTLPlugin() ]
					}));
				}

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

			} catch (ex) {
				err = ex;
			}

		}

		callback(err, result);
	});
};
