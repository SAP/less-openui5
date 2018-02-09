// Copyright 2018 SAP SE.
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

/*eslint-env mocha */
'use strict';

var assert = require('assert');
var readFile = require('./common/helper').readFile;
var fs = require('fs');

// tested module
var Builder = require('../').Builder;

describe('(custom fs) CSS Scoping of', function() {

  describe('comments', function() {

    it('should return same CSS for foo', function() {

      return new Builder({
        fs: require('graceful-fs')
      }).build({
        lessInputPath: 'comments/themes/foo/library.source.less',
        rootPaths: [
          'test/fixtures/libraries/scopes/comments/lib1',
          'test/fixtures/libraries/scopes/comments/lib2',
          'test/fixtures/libraries/lib1'
        ]
      }).then(function(result) {
        assert.equal(result.css, readFile('test/expected/libraries/scopes/comments/lib1/comments/themes/foo/library.css'), 'CSS scoping should be correctly generated');
        assert.equal(result.cssRtl, readFile('test/expected/libraries/scopes/comments/lib1/comments/themes/foo/library-RTL.css'), 'Rtl CSS scoping should be correctly generated');
      });

    });

    it('should return same CSS for bar', function() {

      var readFileCalls = 0,
          statCalls = 0;

      return new Builder({
        fs: {
          readFile: function() {
            readFileCalls++;
            return fs.readFile.apply(fs, arguments);
          },
          stat: function() {
            statCalls++;
            return fs.stat.apply(fs, arguments);
          }
        }
      }).build({
        lessInputPath: 'comments/themes/bar/library.source.less',
        rootPaths: [
          'test/fixtures/libraries/scopes/comments/lib1',
          'test/fixtures/libraries/scopes/comments/lib2',
          'test/fixtures/libraries/lib1',
          'test/fixtures/libraries/lib2'
        ]
      }).then(function(result) {
        assert.equal(result.css, readFile('test/expected/libraries/scopes/comments/lib2/comments/themes/bar/library.css'), 'CSS scoping should be correctly generated');
        assert.equal(result.cssRtl, readFile('test/expected/libraries/scopes/comments/lib2/comments/themes/bar/library-RTL.css'), 'Rtl CSS scoping should be correctly generated');
        assert.equal(readFileCalls, 3, "fs.readFile should have been called 3 times");
        assert.equal(statCalls, 19, "fs.stat should have been called 19 times");
      });

    });

  });

});