"use strict";

const less = require("../thirdparty/less");
const path = require("path");
const url = require("url");

const cssSizePattern = /(-?[.0-9]+)([a-z]*)/;
const percentagePattern = /^\s*(-?[.0-9]+)%\s*$/;

const urlPattern = /('?"?([^)]*\/)?)img\/([^)]*)/;
const urlReplacement = "$1img-RTL/$3";

const swapLeftRightPattern = /(\bright\b|\bleft\b)/g;

const converterFunctions = {
	modifyAttributeName: function(ruleNode, replacement) {
		modifyOnce(ruleNode, "modifyAttributeName", function(node) {
			node.name = replacement;
		});
	},
	shuffle4Values: function(ruleNode) {
		ruleNode.value.value.forEach(function(valueObject) {
			let newParts;
			if (valueObject.type === "Anonymous") {
				const parts = splitBySpace(valueObject.value);
				if (parts.length === 4) {
					newParts = parts.slice(0);
					newParts[1] = parts[3];
					newParts[3] = parts[1];
					valueObject.value = newParts.join(" ");
				}
			} else if (valueObject.type === "Expression") {
				let nodeCount = 0;
				let rightValueIndex = null; let leftValueIndex = null;
				for (let i = 0; i < valueObject.value.length; i++) {
					if (valueObject.value[i].type === "Comment") {
						continue;
					}

					nodeCount++;

					if (nodeCount === 2 && rightValueIndex === null) {
						rightValueIndex = i;
					} else if (nodeCount === 4 && leftValueIndex === null) {
						leftValueIndex = i;
						break;
					}
				}

				if (rightValueIndex !== null && leftValueIndex !== null) {
					newParts = valueObject.value.slice(0);
					newParts[rightValueIndex] = valueObject.value[leftValueIndex];
					newParts[leftValueIndex] = valueObject.value[rightValueIndex];
					valueObject.value = newParts;
				}
			}
		});
	},
	borderRadius: function(ruleNode) {
		ruleNode.value.value.forEach(function(valueObject) {
			if (valueObject.type === "Anonymous") {
				const parts = splitBySpace(valueObject.value);
				valueObject.value = mirrorBorderRadius(parts).join(" ");
			} else if (valueObject.type === "Expression") {
				let newParts = [];
				let currentParts = [];
				for (let i = 0; i < valueObject.value.length; i++) {
					const part = valueObject.value[i];
					if (part.type === "Anonymous" && part.value === "/") {
						newParts = newParts.concat(mirrorBorderRadius(currentParts), part);
						currentParts = [];
					} else {
						currentParts.push(part);
					}
				}
				if (currentParts.length > 0) {
					newParts = newParts.concat(mirrorBorderRadius(currentParts));
				}
				valueObject.value = newParts;
			}
		});
	},
	background: function(ruleNode) {
		ruleNode.value.value.forEach(function(valueObject) {
			if (valueObject.type === "Expression") {
				for (let i = 0; i < valueObject.value.length; i++) {
					const part = valueObject.value[i];

					// first Dimension is the horizontal position value
					if (part.type === "Dimension") {
						// mirror percentage dimensions
						if (part.unit.is("%")) {
							mirrorPercentageDimensionNode(part);
						}

						break;
					}

					// check if first Keyword value (horizontal background posistion) is no percentage value
					if (part.type === "Keyword" &&
						(part.value === "left" ||
						part.value === "right" ||
						part.value === "center")) {
						break;
					}

					// also break if there is a / which splits up posistion and size definitions
					if (part.type === "Anonymous" && part.value === "/") {
						break;
					}
				}
			}
		});
	},
	multiPosition: function(ruleNode) {
		ruleNode.value.value.forEach(function(valueObject) {
			if (valueObject.type === "Expression" && valueObject.value.length >= 1) {
				const potentialPercentageObject = valueObject.value.filter(function(node) {
					// get first node except comments
					return node.type !== "Comment";
				})[0];
				if (potentialPercentageObject &&
					potentialPercentageObject.type === "Dimension" &&
					potentialPercentageObject.unit.is("%")) {
					mirrorPercentageDimensionNode(potentialPercentageObject);
				}
			} else if (valueObject.type === "Anonymous") {
				valueObject.value = splitByComma(valueObject.value).map(function(value) {
					const valueParts = splitBySpace(value);
					const match = valueParts[0].match(percentagePattern);
					if (match) {
						let parsedValue;
						if (match[0].indexOf(".") > -1) {
							parsedValue = parseFloat(match[0]);
						} else {
							parsedValue = parseInt(match[0], 10);
						}
						valueParts[0] = (100 - parsedValue) + "%";
						return valueParts.join(" ");
					} else {
						return value;
					}
				}).join(",");
			} else if (valueObject.type === "Dimension" && valueObject.unit.is("%")) {
				mirrorPercentageDimensionNode(valueObject);
			}
		});
	},
	singlePosition: function(ruleNode) {
		ruleNode.value.value.forEach(function(valueObject) {
			if (valueObject.type === "Expression" && valueObject.value.length >= 1) {
				const potentialPercentageObject = valueObject.value[0];
				if (potentialPercentageObject.type === "Dimension" &&
					potentialPercentageObject.unit.is("%")) {
					mirrorPercentageDimensionNode(potentialPercentageObject);
				}
			} else if (valueObject.type === "Anonymous") {
				const valueParts = splitBySpace(valueObject.value);
				const match = valueParts[0].match(percentagePattern);
				if (match) {
					valueParts[0] = (100 - parseInt(match[0], 10)) + "%";
					valueObject.value = valueParts.join(" ");
				}
			}
		});
	},
	transform: function(ruleNode) {
		ruleNode.value.value.forEach(function(valueObject) {
			if (valueObject.type === "Expression") {
				valueObject.value.forEach(processTransformNode);
			} else {
				processTransformNode(valueObject);
			}
		});
	},
	cursor: function(ruleNode) {
		ruleNode.value.value.forEach(function(valueObject) {
			if (valueObject.type === "Expression") {
				valueObject.value.forEach(processCursorNode);
			} else {
				processCursorNode(valueObject);
			}
		});
	},
	shadow: function(ruleNode) {
		ruleNode.value.value.forEach(function(valueObject) {
			if (valueObject.type === "Expression") {
				for (let i = 0; i < valueObject.value.length; i++) {
					if (valueObject.value[i].type === "Dimension") {
						negate(valueObject.value[i]);
						break;
					}
				}
			} else if (valueObject.type === "Anonymous") {
				modifyOnce(valueObject, "shadow", function(node) {
					node.value = splitByComma(node.value).map(function(part) {
						return mirrorShadow(part);
					}).join(",");
				});
			}
		});
	},
	swapLeftRightValue: function(ruleNode) {
		ruleNode.value.value.forEach(swapLeftRight);
	},
	url: function(ruleNode) {
		ruleNode.value.value.forEach((valueObject) => {
			if (valueObject.type === "Url") {
				this.replaceUrl(valueObject);
			} else if (valueObject.type === "Expression") {
				valueObject.value.forEach((childValueObject) => {
					this.replaceUrl(childValueObject);
				});
			}
		});
	},
	gradient: function(ruleNode) {
		ruleNode.value.value.forEach(function(valueObject) {
			if (valueObject.type === "Expression") {
				valueObject.value.forEach(processGradientCallNode);
			} else {
				processGradientCallNode(valueObject);
			}
		});
	}
};

const converterMapping = {

	modifyAttributeName: {
		"left": "right",
		"right": "left",
		"border-left": "border-right",
		"border-right": "border-left",
		"border-left-color": "border-right-color",
		"border-right-color": "border-left-color",
		"border-left-style": "border-right-style",
		"border-right-style": "border-left-style",
		"border-left-width": "border-right-width",
		"border-right-width": "border-left-width",
		"margin-left": "margin-right",
		"margin-right": "margin-left",
		"padding-left": "padding-right",
		"padding-right": "padding-left",
		"border-bottom-left-radius": "border-bottom-right-radius",
		"border-bottom-right-radius": "border-bottom-left-radius",
		"border-top-left-radius": "border-top-right-radius",
		"border-top-right-radius": "border-top-left-radius",
		"nav-left": "nav-right",
		"nav-right": "nav-left",
		"-moz-border-radius-topright": "-moz-border-radius-topleft",
		"-moz-border-radius-topleft": "-moz-border-radius-topright",
		"-webkit-border-top-right-radius": "-webkit-border-top-left-radius",
		"-webkit-border-top-left-radius": "-webkit-border-top-right-radius",
		"-moz-border-radius-bottomright": "-moz-border-radius-bottomleft",
		"-moz-border-radius-bottomleft": "-moz-border-radius-bottomright",
		"-webkit-border-bottom-right-radius": "-webkit-border-bottom-left-radius",
		"-webkit-border-bottom-left-radius": "-webkit-border-bottom-right-radius"
	},

	shuffle4Values: {
		"border-style": true,
		"border-color": true,
		"border-width": true,
		"margin": true,
		"padding": true,
		"border-image-outset": true,
		"border-image-width": true
	},

	borderRadius: {
		"border-radius": true,
		"-moz-border-radius": true,
		"-webkit-border-radius": true
	},

	background: {
		"background": true
	},

	multiPosition: {
		"background-position": true
	},

	singlePosition: {
		"object-position": true,
		"perspective-origin": true,
		"-moz-perspective-origin": true,
		"-webkit-perspective-origin": true,
		"transform-origin": true,
		"-moz-transform-origin": true,
		"-ms-transform-origin": true,
		"-webkit-transform-origin": true
	},

	transform: {
		"transform": true,
		"-ms-transform": true,
		"-moz-transform": true,
		"-webkit-transform": true
	},

	cursor: {
		"cursor": true
	},

	shadow: {
		"box-shadow": true,
		"-moz-box-shadow": true,
		"-webkit-box-shadow": true,
		"text-shadow": true
	},

	swapLeftRightValue: {
		"background": true,
		"background-position": true,
		"background-image": true,
		"-ms-background-position-x": true,
		"break-after": true,
		"break-before": true,
		"clear": true,
		"object-position": true,
		"float": true,
		"page-break-after": true,
		"page-break-before": true,
		"perspective-origin": true,
		"ruby-align": true,
		// "text-align" is not mirrored because "start" and "end" are available to support RTL!  IE does not support those and shall receive special CSS rules
		"transform-origin": true,
		"-moz-transform-origin": true,
		"-ms-transform-origin": true,
		"-webkit-transform-origin": true
	},

	url: {
		"background": true,
		"background-image": true,
		"content": true,
		"cursor": true,
		"icon": true,
		"list-style-image": true
	},

	gradient: {
		"background": true,
		"background-image": true
	}

};

const transformMapping = {
	negateFirst: {
		"translate": true,
		"translate3d": true,
		"rotate": true,
		"rotatey": true,
		"rotateY": true,
		"rotatez": true,
		"rotateZ": true,
		"skewX": true,
		"skewx": true,
		"skewY": true,
		"skewy": true
	},

	negateTwo: {
		"skew": true
	},

	negateSecondNumber: {
		"rotate3d": true
	}
};

const cursorMapping = {
	"e-resize": "w-resize",
	"w-resize": "e-resize",
	"ne-resize": "nw-resize",
	"nw-resize": "ne-resize",
	"se-resize": "sw-resize",
	"sw-resize": "se-resize",
	"nesw-resize": "nwse-resize",
	"nwse-resize": "nesw-resize"
};

function swapLeftRight(valueObject) {
	if (valueObject.type === "Anonymous" || valueObject.type === "Keyword") {
		modifyOnce(valueObject, "swapLeftRight", function(node) {
			node.value = node.value.replace(swapLeftRightPattern, function(match, p1, offset, string) {
				return p1 === "left" ? "right" : "left";
			});
		});
	} else if (valueObject.type === "Expression") {
		valueObject.value.forEach(swapLeftRight);
	} else if (valueObject.type === "Call") {
		valueObject.args.forEach(swapLeftRight);
	}
}

function splitByComma(value) {
	let lastStart = 0;
	let inParentheses = false;
	const parts = [];
	for (let i = 0; i < value.length; i++) {
		const character = value[i];
		if (character === "(") {
			inParentheses = true;
		} else if (character === ")") {
			inParentheses = false;
		} else if (character === ",") {
			if (!inParentheses) {
				parts.push(value.substring(lastStart, i));
				lastStart = i + 1;
			}
		}
	}
	if (lastStart < value.length - 1) {
		parts.push(value.substring(lastStart));
	}
	return parts;
}

function splitBySpace(value) {
	return value.trim().split(/\s+/);
}

function mirrorBorderRadius(parts) {
	const result = parts.slice(0);
	const valueIndices = []; const commentIndices = [];
	const length = parts.filter(function(part, i) {
		if (part.type !== "Comment") {
			valueIndices.push(i);
			return true;
		} else {
			commentIndices.push(i);
			return false;
		}
	}).length;

	if (length === 2) {
		// 1 2 -> 2 1
		result[valueIndices[0]] = parts[valueIndices[1]];
		result[valueIndices[1]] = parts[valueIndices[0]];
	} else if (length === 3) {
		// 1 2 3 -> 2 1 2 3

		result[valueIndices[0]] = parts[valueIndices[1]];
		result[valueIndices[1]] = parts[valueIndices[0]];
		result[valueIndices[2]] = parts[valueIndices[1]];
		result.splice(valueIndices[2] + 1, 0, parts[valueIndices[2]]);
	} else if (length === 4) {
		// 1 2 3 4 -> 2 1 4 3

		result[valueIndices[0]] = parts[valueIndices[1]];
		result[valueIndices[1]] = parts[valueIndices[0]];
		result[valueIndices[2]] = parts[valueIndices[3]];
		result[valueIndices[3]] = parts[valueIndices[2]];
	}
	return result;
}

function negate(node) {
	if (node.type === "Dimension") {
		modifyOnce(node, "negate", function(negateNode) {
			negateNode.value = -negateNode.value;
		});
	}
}

function processTransformNode(node) {
	if (node.type !== "Call") {
		return;
	}

	const name = node.name;
	if (transformMapping.negateFirst[name]) {
		negate(node.args[0]);
	} else if (transformMapping.negateTwo[name]) {
		negate(node.args[0]);
		if (node.args.length > 1) {
			negate(node.args[1]);
		}
	} else if (transformMapping.negateSecondNumber[name]) {
		negate(node.args[1]);
	}
}

function mirrorShadow(value) {
	const parts = splitBySpace(value);
	const offsetXIndex = (parts[0] === "inset" && parts.length > 1) ? 1 : 0;
	const offsetX = parts[offsetXIndex];
	const match = offsetX.match(cssSizePattern);
	if (match) {
		const offsetXValue = match[1];
		let negated;
		if (offsetXValue.indexOf(".") > -1) {
			negated = -parseFloat(offsetXValue);
		} else {
			negated = -parseInt(offsetXValue, 10);
		}
		parts[offsetXIndex] = negated + match[2];
	}

	return parts.join(" ");
}

function mirrorPercentageDimensionNode(node) {
	if (node.type === "Dimension" && node.unit.is("%")) {
		modifyOnce(node, "mirrorPercentageDimensionNode", function(mirrorNode) {
			mirrorNode.value = 100 - mirrorNode.value;
		});
	}
}

function processGradientCallNode(node) {
	if (node.type === "Call" &&
		endsWith(node.name, "linear-gradient") &&
		node.args.length >= 1) {
		const firstPart = node.args[0];
		if (firstPart.type === "Dimension") {
			if (firstPart.unit.is("%")) {
				mirrorPercentageDimensionNode(firstPart);
			}

			mirrorLinearGradientAngle(firstPart);
		} else if (firstPart.type === "Expression") {
			const firstSubPart = firstPart.value[0];

			if (firstSubPart.type === "Dimension" && firstSubPart.unit.is("%")) {
				mirrorPercentageDimensionNode(firstSubPart);
			}

			firstPart.value.forEach(mirrorLinearGradientAngle);
		}
	}
}

function mirrorLinearGradientAngle(node) {
	if (node.type !== "Dimension") {
		return;
	}
	modifyOnce(node, "mirrorLinearGradientAngle", function(mirrorNode) {
		switch (mirrorNode.unit.toString()) {
		case "deg":
			mirrorNode.value = 180 - mirrorNode.value;
			break;
		case "grad":
			mirrorNode.value = 200 - mirrorNode.value;
			break;
		case "rad":
			mirrorNode.value = Math.round((Math.PI - mirrorNode.value) * 100) / 100;
			break;
		case "turn":
			mirrorNode.value = Math.round((0.5 - mirrorNode.value) * 100) / 100;
			break;
		default:
			break;
		}
	});
}

function processCursorNode(node) {
	if (node.type === "Keyword") {
		const replacement = cursorMapping[node.value];
		if (replacement) {
			modifyOnce(node, "cursor", function(cursorNode) {
				cursorNode.value = replacement;
			});
		}
	}
}

function endsWith(str, suffix) {
	return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function modifyOnce(node, type, fn) {
	if (!node.___rtlModified) {
		node.___rtlModified = {};
	}
	if (!node.___rtlModified[type]) {
		fn(node);
		node.___rtlModified[type] = true;
	}
}

/**
 *
 * @constructor
 */
const LessRtlPlugin = module.exports = function() {
	/* eslint-disable new-cap */
	this.oVisitor = new less.tree.visitor(this);
	/* eslint-enable new-cap */
	this.resolvedImgRtlPaths = [];
};

LessRtlPlugin.prototype = {
	isReplacing: true,
	isPreEvalVisitor: false,
	run: function(root) {
		return this.oVisitor.visit(root);
	},
	visitRule: function(ruleNode, visitArgs) {
		for (const converter in converterMapping) {
			if (Object.prototype.hasOwnProperty.call(converterMapping, converter)) {
				const mappingValue = converterMapping[converter][ruleNode.name];
				if (mappingValue) {
					converterFunctions[converter].call(this, ruleNode, mappingValue);
				}
			}
		}

		return ruleNode;
	},
	replaceUrl: function(node) {
		if (node.type !== "Url") {
			return;
		}
		modifyOnce(node, "replaceUrl", (urlNode) => {
			const imgPath = urlNode.value.value;
			const parsedUrl = url.parse(imgPath);
			if (parsedUrl.protocol || imgPath.startsWith("/")) {
				// Ignore absolute urls
				return;
			}
			const imgPathRTL = LessRtlPlugin.getRtlImgUrl(imgPath);
			if (!imgPathRTL) {
				return;
			}
			const resolvedUrl = path.posix.join(urlNode.currentFileInfo.currentDirectory, imgPathRTL);
			if (this.existingImgRtlPaths.includes(resolvedUrl)) {
				urlNode.value.value = imgPathRTL;
			}
		});
	},
	setExistingImgRtlPaths: function(existingImgRtlPaths) {
		this.existingImgRtlPaths = existingImgRtlPaths;
	}
};

LessRtlPlugin.getRtlImgUrl = function(url) {
	if (urlPattern.test(url)) {
		return url.replace(urlPattern, urlReplacement);
	} else {
		return null;
	}
};
