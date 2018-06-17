"use strict";

exports.__esModule = true;
exports.default = void 0;

var _babelPluginMacros = require("babel-plugin-macros");

var _placeholders = _interopRequireDefault(require("./placeholders"));

var _implicitParams = _interopRequireDefault(require("./implicit-params"));

var _lift = _interopRequireDefault(require("./lift"));

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
  if (references.lift) (0, _lift.default)(t, references.lift);
}

var _default = (0, _babelPluginMacros.createMacro)(transform);

exports.default = _default;