// Copyright 2014 SAP SE.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http: //www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
// either express or implied. See the License for the specific
// language governing permissions and limitations under the License.

'use strict';

module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({

		// Lint
		eslint: {
			all: [
				'Gruntfile.js',
				'lib/**/*.js',
				'<%= mochaTest.tests.src %>'
			]
		},

		// Unit tests
		mochaTest: {
			tests: {
				src: ['test/test.js']
			}
		}

	});

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-eslint');
	grunt.loadNpmTasks('grunt-mocha-test');

	// Run mocha unit tests
	grunt.registerTask('test', ['mochaTest']);

	// By default, lint and run all tests.
	grunt.registerTask('default', ['eslint', 'test']);

};
