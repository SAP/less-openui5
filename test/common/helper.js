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

'use strict';

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

module.exports.readFile = readFile;
