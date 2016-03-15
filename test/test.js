// Copyright 2016 SAP SE.
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
var path = require('path');
var fs = require('fs');

var crlfPattern = /\r\n/g;
var lastLfPattern = /\n$/;
var noLastLfPattern = /([^\n])$/;

// file util
function readFile(filename, lastLf) {
  var content = fs.readFileSync(filename, { encoding: 'utf-8' }).replace(crlfPattern, '\n');
  if (lastLf === false) {
    return content.replace(lastLfPattern, ''); // needed when using compress option
  } else {
    return content.replace(noLastLfPattern, '$1\n'); // adds last LF
  }
}

// tested module
var lessOpenUI5 = require('../lib');

describe('options', function() {

  it('should return css, cssRtl, variables and imports with default options', function(done) {

    lessOpenUI5.build(readFile('test/fixtures/simple/test.less'), function(err, result) {

      assert.ifError(err);

      assert.equal(result.css, readFile('test/expected/simple/test.css'), 'css should be correctly generated.');
      assert.equal(result.cssRtl, readFile('test/expected/simple/test-RTL.css'), 'rtl css should be correctly generated.');
      assert.deepEqual(result.variables, JSON.parse(readFile('test/expected/simple/test-variables.json')), 'variables should be correctly collected.');
      assert.deepEqual(result.imports, [], 'import list should be empty.');

      done();

    });

  });

  it('should not return cssRtl with option rtl set to false', function(done) {

    lessOpenUI5.build(readFile('test/fixtures/simple/test.less'), {
      rtl: false
    }, function(err, result) {

      assert.ifError(err);

      assert.equal(result.css, readFile('test/expected/simple/test.css'), 'css should be correctly generated.');
      assert.strictEqual(result.cssRtl, undefined, 'rtl css should not be generated.');
      assert.deepEqual(result.variables, JSON.parse(readFile('test/expected/simple/test-variables.json')), 'variables should be correctly collected.');

      done();

    });

  });

  it('should return minified css and cssRtl with lessOption compress set to true', function(done) {

    lessOpenUI5.build(readFile('test/fixtures/simple/test.less'), {
      compiler: {
        compress: true
      }
    }, function(err, result) {

      assert.ifError(err);

      // remove the last LF to be able to compare the content correctly
      assert.equal(result.css, readFile('test/expected/simple/test.min.css', false), 'css should be correctly generated.');
      assert.equal(result.cssRtl, readFile('test/expected/simple/test-RTL.min.css', false), 'rtl css should be correctly generated.');
      assert.deepEqual(result.variables, JSON.parse(readFile('test/expected/simple/test-variables.min.json')), 'variables should be correctly collected.');
      assert.deepEqual(result.imports, [], 'import list should be empty.');

      done();

    });

  });

  it('should resolve import directives with rootPaths option', function(done) {

    lessOpenUI5.build(readFile('test/fixtures/rootPaths/lib2/my/themes/bar/bar.less'), {
      rootPaths: [
        'test/fixtures/rootPaths/lib1',
        'test/fixtures/rootPaths/lib2'
      ],
      parser: {
        filename: 'test/fixtures/rootPaths/lib2/my/themes/bar/bar.less'
      }
    }, function(err, result) {

      assert.ifError(err);

      assert.equal(result.css, '', 'css should be empty.');
      assert.deepEqual(result.variables, {}, 'variables should be empty.');
      assert.deepEqual(result.imports, [
        path.join(
          'test', 'fixtures', 'rootPaths',
          'lib1', 'my', 'themes', 'foo', 'foo.less'
        )
      ], 'import list should not correctly filled.');

      done();

    });

  });

});

describe('error handling', function() {

  it('should have correct error in case of undefined variable usage', function(done) {

    lessOpenUI5.build(readFile('test/fixtures/error/undefined-var.less'), function(err, result) {
      assert.ok(err);
      done();
    });

  });

});

function assertLessToRtlCssEqual(filename, done) {
    var lessFilename = 'test/fixtures/rtl/' + filename + '.less';
    var cssFilename = 'test/expected/rtl/' + filename + '.css';

    lessOpenUI5.build(readFile(lessFilename), {
      parser: {
        filename: filename + '.less',
        paths: 'test/fixtures/rtl'
      }
    }, function(err, result) {

      assert.ifError(err);
      assert.equal(result.cssRtl, readFile(cssFilename), 'rtl css should not be generated.');

      done();

    });

}

describe('rtl', function() {

  it('background-position', function(done) {
      assertLessToRtlCssEqual('background-position', done);
  });

  it('background', function(done) {
      assertLessToRtlCssEqual('background', done);
  });

  it('border', function(done) {
      assertLessToRtlCssEqual('border', done);
  });

  it('cursor', function(done) {
      assertLessToRtlCssEqual('cursor', done);
  });

  it('gradient', function(done) {
      assertLessToRtlCssEqual('gradient', done);
  });

  it('image-url', function(done) {
      assertLessToRtlCssEqual('image-url', done);
  });

  it('misc', function(done) {
      assertLessToRtlCssEqual('misc', done);
  });

  it('shadow', function(done) {
      assertLessToRtlCssEqual('shadow', done);
  });

  it('transform', function(done) {
      assertLessToRtlCssEqual('transform', done);
  });

  it('variables', function(done) {
      assertLessToRtlCssEqual('variables', done);
  });

});

describe('variables', function() {

  it('should return only globally defined variables', function(done) {

    lessOpenUI5.build(readFile('test/fixtures/variables/main.less'), function(err, result) {

      assert.ifError(err);

      assert.equal(result.css, readFile('test/expected/variables/main.css'), 'css should be correctly generated.');
      assert.deepEqual(result.variables, JSON.parse(readFile('test/expected/variables/variables.json')), 'variables should be correctly collected.');
      assert.deepEqual(result.imports, [], 'import list should be empty.');

      done();

    });

  });

});

describe('imports', function() {

  it('should return imported file paths', function(done) {

    lessOpenUI5.build(readFile('test/fixtures/imports/main.less'), {
      parser: {
        filename: 'main.less',
        paths: [ 'test/fixtures/imports' ]
      }
    }, function(err, result) {

      assert.ifError(err);

      assert.equal(result.css, readFile('test/expected/imports/main.css'), 'css should be correctly generated.');
      assert.deepEqual(result.variables, {}, 'variables should be empty.');
      assert.deepEqual(result.imports, [
        path.join('test', 'fixtures', 'imports', 'dir1', 'foo.less'),
        path.join('test', 'fixtures', 'imports', 'dir2', 'bar.less'),
        path.join('test', 'fixtures', 'imports', 'dir3', 'inline.css')
      ], 'import list should be correctly filled.');

      done();

    });

  });

  it('should use "relativeUrls" parser option by default', function(done) {

    lessOpenUI5.build(readFile('test/fixtures/imports/main.less'), {
      parser: {
        filename: 'main.less',
        paths: [ 'test/fixtures/imports' ]
      }
    }, function(err, result) {

      assert.ifError(err);

      assert.equal(result.css, readFile('test/expected/imports/main.css'), 'css should be correctly generated.');

      done();

    });

  });

  it('should not rewrite urls when "relativeUrls" parser option is set to "false"', function(done) {

    lessOpenUI5.build(readFile('test/fixtures/imports/main.less'), {
      parser: {
        filename: 'main.less',
        paths: [ 'test/fixtures/imports' ],
        relativeUrls: false
      }
    }, function(err, result) {

      assert.ifError(err);

      assert.equal(result.css, readFile('test/expected/imports/main-no-relativeUrls.css'), 'css should be correctly generated.');

      done();

    });

  });

});

describe('inline theming parameters', function() {

  it('should not include inline parameters when no library name is given', function(done) {

    lessOpenUI5.build(readFile('test/fixtures/simple/test.less'), function(err, result) {

      assert.ifError(err);

      assert.ok(!/#sap-ui-theme-/.test(result.css), 'inline parameter rule should not be present.');
      assert.ok(!/data:text\/plain/.test(result.css), 'data-uri should not be present.');

      assert.equal(result.css, readFile('test/expected/simple/test.css'), 'css should be correctly generated.');

      done();

    });

  });

  it('should include inline parameters when library name is given', function(done) {

    lessOpenUI5.build(readFile('test/fixtures/simple/test.less'), {
      library: {
        name: 'foo.bar'
      }
    }, function(err, result) {

      assert.ifError(err);

      assert.ok(/#sap-ui-theme-foo\\.bar/.test(result.css), 'inline parameter rule for library should be present.');
      assert.ok(/data:text\/plain/.test(result.css), 'data-uri should be present.');

      assert.equal(result.css, readFile('test/expected/simple/test-inline-parameters.css'), 'css should be correctly generated.');

      done();

    });

  });

});
