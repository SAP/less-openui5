const themingParameters = {
	addInlineParameters({result, options}) {
		switch (options.themingParameters) {
		case themingParameters.STRATEGY.DATA_URI:
			require("./dataUri").addInlineParameters({result, options});
			break;
		case themingParameters.STRATEGY.CSS_VARIABLES:
			require("./cssVariables").addInlineParameters({result, options});
			break;
		}
		return result;
	},
	STRATEGY: {
		DATA_URI: "DATA_URI",
		CSS_VARIABLES: "CSS_VARIABLES"
	}
};

module.exports = themingParameters;
