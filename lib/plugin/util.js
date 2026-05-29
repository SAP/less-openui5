"use strict";

/**
 * Checks whether a CSS url() value should be treated as absolute, i.e. must not be resolved
 * relative to the current file. This covers urls carrying a scheme (http:, https:, data:, ...)
 * as well as server-absolute urls starting with "/".
 *
 * URL.canParse only succeeds for absolute urls (those with a scheme), so relative urls return
 * false.
 *
 * @param {string} value the url value as taken from the CSS url() node
 * @returns {boolean} true if the url is absolute and should not be resolved relatively
 */
function isAbsoluteUrl(value) {
	return URL.canParse(value) || value.startsWith("/");
}

module.exports = {
	isAbsoluteUrl
};
