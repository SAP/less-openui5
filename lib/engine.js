let engineInfo;
module.exports.getInfo = function() {
	if (!engineInfo) {
		const {name, version} = require("../package.json");
		engineInfo = {name, version};
	}
	return engineInfo;
};
