module.exports = {
	addInlineParameters: function({result, options}) {
		// Inline parameters can only be added when the library name is known
		if (typeof options.library !== "object" || typeof options.library.name !== "string") {
			return result;
		}

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

		return result;
	}
};
