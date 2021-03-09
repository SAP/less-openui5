"use strict";

const path = require("path");
const url = require("url");
const less = require("../thirdparty/less");

const urlNodeNames = {
	"background": true,
	"background-image": true,
	"content": true,
	"cursor": true,
	"icon": true,
	"list-style-image": true
};

/**
 * @constructor
 */
const UrlCollectorPlugin = module.exports = function() {
	/* eslint-disable-next-line new-cap */
	this.oVisitor = new less.tree.visitor(this);
	this.urls = new Map();
};

UrlCollectorPlugin.prototype = {
	isReplacing: false,
	isPreEvalVisitor: false,
	run: function(root) {
		return this.oVisitor.visit(root);
	},
	visitRule: function(ruleNode) {
		if (urlNodeNames[ruleNode.name]) {
			this.visitUrl(ruleNode);
		}
	},
	visitUrl: function(ruleNode) {
		for (const valueObject of ruleNode.value.value) {
			if (valueObject.type === "Url") {
				this.addUrlFromNode(valueObject);
			} else if (valueObject.type === "Expression") {
				for (const node of valueObject.value) {
					this.addUrlFromNode(node);
				}
			}
		}
	},
	addUrlFromNode: function(node) {
		if (node.type === "Url") {
			const relativeUrl = node.value.value;

			const parsedUrl = url.parse(relativeUrl);
			// Ignore urls with protocol (also includes data urls)
			// Ignore server absolute urls
			if (parsedUrl.protocol || relativeUrl.startsWith("/")) {
				return;
			}

			const {currentDirectory} = node.currentFileInfo;

			const resolvedUrl = path.posix.join(currentDirectory, relativeUrl);
			this.urls.set(resolvedUrl, {currentDirectory, relativeUrl});
		}
	},
	getUrls: function() {
		return Array.from(this.urls.values());
	}
};
