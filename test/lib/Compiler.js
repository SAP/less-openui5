/* eslint-env mocha */

const assert = require("assert");
const sinon = require("sinon");

// tested module
const Compiler = require("../../lib/Compiler");

describe("Compiler#createFileHandler", function() {
	before(() => {
		sinon.stub(console, "log");
	});
	after(() => {
		sinon.restore();
	});

	it("should propagate errors via callback function (TypeError)", async function() {
		const compiler = new Compiler({
			options: {
				rootPaths: ["foo"]
			},
			fileUtils: undefined // This will cause a TypeError when calling fileUtils.readFile
		});

		const file = "someFile";
		const currentFileInfo = {
			currentDirectory: "someFolder"
		};
		const handleDataAndCallCallback = sinon.stub();
		const callback = sinon.stub();

		await compiler.fnFileHandler(file, currentFileInfo, handleDataAndCallCallback, callback);

		assert.equal(handleDataAndCallCallback.callCount, 0);
		assert.equal(callback.callCount, 1);
		assert.equal(callback.getCall(0).args.length, 1);
		assert.equal(callback.getCall(0).args[0].name, "TypeError");
	});
	it("should propagate errors via callback function (File not found)", async function() {
		const compiler = new Compiler({
			options: {
				rootPaths: ["foo"]
			},
			fileUtils: {
				readFile: sinon.stub().resolves(null)
			},
		});

		const file = "someFile";
		const currentFileInfo = {
			currentDirectory: "someFolder"
		};
		const handleDataAndCallCallback = sinon.stub();
		const callback = sinon.stub();

		await compiler.fnFileHandler(file, currentFileInfo, handleDataAndCallCallback, callback);

		assert.equal(handleDataAndCallCallback.callCount, 0);
		assert.equal(callback.callCount, 1);
		assert.equal(callback.getCall(0).args.length, 1);
		assert.equal(callback.getCall(0).args[0].type, "File");
		assert.equal(callback.getCall(0).args[0].message,
			`Could not find file at path 'someFolder/someFile'`
		);
	});
	it("should propagate errors via callback function (error within handleDataAndCallCallback)", async function() {
		const compiler = new Compiler({
			options: {
				rootPaths: ["foo"]
			},
			fileUtils: {
				readFile: sinon.stub().resolves({
					path: "", content: ""
				})
			},
		});

		const file = "someFile";
		const currentFileInfo = {
			currentDirectory: "someFolder"
		};
		const handleDataAndCallCallback = sinon.stub().throws(new Error("Error from handleDataAndCallCallback"));
		const callback = sinon.stub();

		await compiler.fnFileHandler(file, currentFileInfo, handleDataAndCallCallback, callback);

		assert.equal(handleDataAndCallCallback.callCount, 1);
		assert.equal(callback.callCount, 1);
		assert.equal(callback.getCall(0).args.length, 1);
		assert.equal(callback.getCall(0).args[0].message,
			`Error from handleDataAndCallCallback`
		);
	});
});
