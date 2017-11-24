"use strict";

exports.__esModule = true;
exports.default = transformImplicitParams;

var _babelMacros = require("babel-macros");

var _util = require("./util");

function transformImplicitParams(t, refs) {
  refs.forEach(referencePath => {
    var _findTargetCallee, _referencePath$findPa;

    const parent = (_findTargetCallee = (0, _util.findTargetCallee)(referencePath)) !== null && _findTargetCallee !== void 0 ? _findTargetCallee : (_referencePath$findPa = referencePath.findParent(_it => {
      return _it.isVariableDeclarator();
    })) === null || _referencePath$findPa === void 0 ? void 0 : _referencePath$findPa.get('init');

    if (!parent) {
      throw new _babelMacros.MacroError('Implicit parameters must be used as function arguments or the\n' + 'right side of a variable declaration, ie. `const identity = it`)');
    }

    if (parent.getData('it.wasTransformed')) {
      parent.scope.rename(referencePath.node.name, parent.getData('it.idName'));
      return;
    }

    const id = parent.scope.generateUidIdentifier('it');
    parent.scope.rename(referencePath.node.name, id.name);
    const fn = t.arrowFunctionExpression([id], t.blockStatement([t.returnStatement(parent.node)]));

    const _parent$replaceWith = parent.replaceWith(fn),
          result = _parent$replaceWith[0];

    result.setData('it.wasTransformed', true);
    result.setData('it.idName', id.name);
  });
}