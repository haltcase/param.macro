"use strict";

var _babelPluginMacros = require("babel-plugin-macros");

var _placeholders = _interopRequireDefault(require("./placeholders"));

var _implicitParams = _interopRequireDefault(require("./implicit-params"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function transform({
  references,
  state,
  babel: {
    types: t
  }
}) {
  // `it` needs to be transformed before `_` to allow them to work together
  if (references.it) (0, _implicitParams.default)(t, references.it);
  if (references.default) (0, _implicitParams.default)(t, references.default);
  if (references._) (0, _placeholders.default)(t, references._);
}

module.exports = (0, _babelPluginMacros.createMacro)(transform);