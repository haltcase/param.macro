"use strict";

exports.__esModule = true;
exports.default = transformLift;

var _util = require("./util");

function transformLift(t, refs) {
  refs.forEach(referencePath => {
    const parentPath = referencePath.parentPath;

    if (!parentPath.isCallExpression()) {
      throw new _util.PartialError('`lift` can only be used as a call expression');
    }

    const args = parentPath.get('arguments');

    if (args.length !== 1) {
      throw new _util.PartialError('`lift` accepts a single expression as its only argument');
    }

    parentPath.replaceWith(args[0]);
  });
}