"use strict";

const fs = require("fs");

const crlfPattern = /\r\n/g;
const lastLfPattern = /\n$/;
const noLastLfPattern = /([^\n])$/;

// file util
function readFile(filename, lastLf) {
	const content = fs.readFileSync(filename, {encoding: "utf-8"}).replace(crlfPattern, "\n");
	if (lastLf === false) {
		return content.replace(lastLfPattern, ""); // needed when using compress option
	} else {
		return content.replace(noLastLfPattern, "$1\n"); // adds last LF
	}
}

module.exports.readFile = readFile;
