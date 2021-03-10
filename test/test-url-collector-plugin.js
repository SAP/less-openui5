/* eslint-env mocha */
"use strict";

const assert = require("assert");
const sinon = require("sinon");
// const readFile = require("./common/helper").readFile;

const Builder = require("../lib").Builder;

// tested module
const UrlCollectorPlugin = require("../lib/plugin/url-collector");
const RtlPlugin = require("../lib/plugin/rtl");

describe("UrlCollectorPlugin", function() {
	let getUrlsSpy; let setExistingImgRtlPathsSpy;
	beforeEach(function() {
		getUrlsSpy = sinon.spy(UrlCollectorPlugin.prototype, "getUrls");
		setExistingImgRtlPathsSpy = sinon.spy(RtlPlugin.prototype, "setExistingImgRtlPaths");
	});
	afterEach(function() {
		sinon.restore();
	});

	it("should return empty array when there are no urls", function() {
		return new Builder().build({
			lessInputPath: "test/fixtures/simple/test.less",
		}).then(function(result) {
			assert.equal(getUrlsSpy.callCount, 1, "UrlCollectorPlugin#getUrls should be called once");
			const getUrlsCall = getUrlsSpy.getCall(0);
			const collectedUrls = getUrlsCall.returnValue;
			assert.deepEqual(collectedUrls, []);
		});
	});

	it("should collect and resolve all relative urls", function() {
		return new Builder().build({
			lessInputPath: "test/fixtures/rtl/background.less",
		}).then(function(/* result */) {
			assert.equal(getUrlsSpy.callCount, 1, "UrlCollectorPlugin#getUrls should be called once");
			const getUrlsCall = getUrlsSpy.getCall(0);
			const collectedUrls = getUrlsCall.returnValue;
			assert.deepEqual(collectedUrls, [
				{
					relativeUrl: "chess.png",
					currentDirectory: "test/fixtures/rtl/"
				},
				{
					relativeUrl: "img/column_header.gif",
					currentDirectory: "test/fixtures/rtl/"
				},
				{
					relativeUrl: "img/drop-down_ico.png",
					currentDirectory: "test/fixtures/rtl/"
				},
				{
					relativeUrl: "img/hover_column_header.gif",
					currentDirectory: "test/fixtures/rtl/"
				},
				{
					relativeUrl: "img/column_header2.gif",
					currentDirectory: "test/fixtures/rtl/"
				},
				{
					relativeUrl: "img/column_header3.gif",
					currentDirectory: "test/fixtures/rtl/"
				}
			]);

			assert.equal(setExistingImgRtlPathsSpy.callCount, 1,
				"RtlPlugin#setExistingImgRtlPathsSpy should be called once");
			const setExistingImgRtlPathsCall = setExistingImgRtlPathsSpy.getCall(0);

			assert.deepEqual(setExistingImgRtlPathsCall.args, [
				[
					"test/fixtures/rtl/img-RTL/column_header.gif",
					"test/fixtures/rtl/img-RTL/drop-down_ico.png",
					"test/fixtures/rtl/img-RTL/hover_column_header.gif",
					"test/fixtures/rtl/img-RTL/column_header2.gif",
					"test/fixtures/rtl/img-RTL/column_header3.gif"
				]
			]);
		});
	});

	it("should not collect data-urls", function() {
		return new Builder().build({
			lessInput: `
.rule {
	background-image: url(data:image/png;base64,iVBORw0KGgoAAAAN);
}
			`,
		}).then(function(/* result */) {
			assert.equal(getUrlsSpy.callCount, 1, "UrlCollectorPlugin#getUrls should be called once");
			const getUrlsCall = getUrlsSpy.getCall(0);
			const collectedUrls = getUrlsCall.returnValue;
			assert.deepEqual(collectedUrls, []);

			assert.equal(setExistingImgRtlPathsSpy.callCount, 1,
				"RtlPlugin#setExistingImgRtlPathsSpy should be called once");
			const setExistingImgRtlPathsCall = setExistingImgRtlPathsSpy.getCall(0);

			assert.deepEqual(setExistingImgRtlPathsCall.args, [
				[]
			]);
		});
	});

	it("should not fail on empty url", function() {
		return new Builder().build({
			lessInput: `
.rule {
	background-image: url();
}
			`,
		}).then(function(/* result */) {
			assert.equal(getUrlsSpy.callCount, 1, "UrlCollectorPlugin#getUrls should be called once");
			const getUrlsCall = getUrlsSpy.getCall(0);
			const collectedUrls = getUrlsCall.returnValue;
			assert.deepEqual(collectedUrls, [
				{
					currentDirectory: "",
					relativeUrl: ""
				}
			]);

			assert.equal(setExistingImgRtlPathsSpy.callCount, 1,
				"RtlPlugin#setExistingImgRtlPathsSpy should be called once");
			const setExistingImgRtlPathsCall = setExistingImgRtlPathsSpy.getCall(0);

			assert.deepEqual(setExistingImgRtlPathsCall.args, [
				[]
			]);
		});
	});
});
