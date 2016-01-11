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

'use strict';
var less = require('less');

var VariableCollector = module.exports = function() {
  /*eslint-disable new-cap */
  this.oVisitor = new less.tree.visitor(this);
  /*eslint-enable new-cap */
  this.mVariables = {};
  this.mAllVariables = {};
  this.iMixinLevel = 0;

  var that = this;

  this.fnRuleEval = less.tree.Rule.prototype.eval;
  less.tree.Rule.prototype.eval = function(env) {
    if (this.variable && typeof this.name === 'string' && this.name.indexOf('@_PRIVATE_') !== 0) {
      try {
        that.mAllVariables[this.name] = this.value.eval(env).toCSS(env);
      } catch (ex) {
        // causes an exception when variable is not defined. ignore it here, less will take care of it
      }
    }
    return that.fnRuleEval.apply(this, arguments);
  };

};

VariableCollector.prototype = {
  run: function (root) {
    var mGlobalVariables = root.variables();
    for (var name in this.mAllVariables) {
      if (mGlobalVariables[name]) {
        this.mVariables[name.substr(1)] = this.mAllVariables[name];
      }
    }
    less.tree.Rule.prototype.eval = this.fnRuleEval;
  },
  getVariables: function() {
    return this.mVariables;
  }
};
