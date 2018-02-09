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
var path = require('path');
var readFile = require('./common/helper').readFile;

// tested module
var Builder = require('../').Builder;

describe('performance workaround', function() {

  it('should run with patched String prototype', function() {

    function customGetter() {
        return "customGetter";
    }
    String.prototype.__defineGetter__("customGetter", customGetter);

    function customProp() {
        return "customProp";
    }
    String.prototype.customProp = customProp;

    return new Builder().build({
      lessInputPath: 'my/ui/lib/themes/foo/library.source.less',
      rootPaths: [
        'test/fixtures/libraries/lib1',
        'test/fixtures/libraries/lib2'
      ],
      library: {
        name: "my.ui.lib"
      }
    }).then(function(result) {

      var oVariablesExpected = {
        "default" : {
          "color1": "#ffffff",

        },
        "scopes": {
          "fooContrast": {
            "color1": "#000000"
          }
        }
      }

      assert.equal(result.css, readFile('test/expected/libraries/lib1/my/ui/lib/themes/foo/library.css'), 'css should be correctly generated.');
      assert.equal(result.cssRtl, readFile('test/expected/libraries/lib1/my/ui/lib/themes/foo/library-RTL.css'), 'rtl css should be correctly generated.');
      assert.deepEqual(result.variables, oVariablesExpected, 'variables should be correctly collected.');
      assert.deepEqual(result.imports, [
        path.join("test", "fixtures", "libraries", "lib1", "my", "ui", "lib", "themes", "foo", "library.source.less"),
				path.join("test", "fixtures", "libraries", "lib1", "my", "ui", "lib", "themes", "base", "library.source.less"),
				path.join("test", "fixtures", "libraries", "lib1", "my", "ui", "lib", "themes", "base", "global.less"),
				path.join("test", "fixtures", "libraries", "lib1", "my", "ui", "lib", "themes", "foo", "global.less"),
        path.join("test", "fixtures", "libraries", "lib2", "my", "ui", "lib", "themes", "bar", "library.source.less"),
				path.join("test", "fixtures", "libraries", "lib2", "my", "ui", "lib", "themes", "bar", "global.less"),
        path.join("test", "fixtures", "libraries", "lib1", "sap", "ui", "core", "themes", "foo", ".theming")
      ], 'import list should be correct.');

      assert.strictEqual(String.prototype.__lookupGetter__("customGetter"), customGetter, "Custom getter should again be set on String prototype.");
      assert.strictEqual(String.prototype.customProp, customProp, "Custom property should again be set on String prototype.");

    });

  });

});
