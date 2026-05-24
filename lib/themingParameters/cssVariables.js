const engine = require("../engine");

// match a CSS url
// (taken from sap/ui/core/theming/Parameters.js)
const rCssUrl = /url[\s]*\('?"?([^'")]*)'?"?\)/;

module.exports = {
	addInlineParameters({result, options}) {
		// CSS Variables can only be added when the library name is known
		if (typeof options.library !== "object" || typeof options.library.name !== "string") {
			return;
		}

		const libraryNameDashed = options.library.name.replace(/\./g, "-");
		const themeMetadata = this.getThemeMetadata({result, options});

		const themeMetadataVariable = `
:root {
  --sapThemeMetaData-UI5-${libraryNameDashed}: ${JSON.stringify(themeMetadata)};
}
`;

		const urlVariables = this.getUrlVariables({result});
		const themingCssVariables = this.getThemingCssVariables({result});

		const themingParameters = `
/* Inline theming parameters (CSS Variables) */
:root {
  --sapUiTheme-${libraryNameDashed}: ${JSON.stringify(urlVariables)};
${themingCssVariables}
}
`;

		result.css += themeMetadataVariable + themingParameters;
		if (options.rtl) {
			result.cssRtl += themeMetadataVariable + themingParameters;
		}
	},
	getThemeMetadata({result, options}) {
		let scopes;
		if (typeof result.variables.scopes === "object") {
			scopes = Object.keys(result.variables.scopes);
		} else {
			scopes = [];
		}

		const libraryNameSlashed = options.library.name.replace(/\./g, "/");

		// TODO: How to get theme name? .theming "sId"? parse from file path? new parameter?
		const themeId = "<theme-name>";
		// TODO: How to get base theme name(s)? Read from .theming?
		const Extends = ["<base-theme>"];

		const {version, name} = engine.getInfo();
		return {
			Path: `UI5.${libraryNameSlashed}.${themeId}.library`,
			PathPattern: "/%frameworkId%/%libId%/themes/%themeId%/%fileId%.css",
			Extends,
			Scopes: scopes,
			Engine: {
				Version: version,
				Name: name
			},
			Version: {
				Build: "<TODO>", // TOOD: add new property options.library.version
				Source: "<TODO>" // TOOD: add new property options.library.version
			}
		};
	},
	getUrlVariables({result}) {
		const urlVariables = {};

		// TODO: support scopes (default/scopes top-level properties, see runtime code)
		Object.entries(result.variables).map(([name, value]) => {
			if (rCssUrl.test(value)) {
				urlVariables[name] = value;
			}
		});

		return urlVariables;
	},
	getThemingCssVariables({result}) {
		return Object.entries(result.variables).map(([name, value]) => {
			return `  --${name}: ${value};`;
		}).join("\n");
	},
};
