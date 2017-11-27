"use strict";

exports.__esModule = true;
exports.default = transformPlaceholders;

var _util = require("./util");

function transformPlaceholders(t, refs) {
  const hoistTargets = [];
  refs.forEach(referencePath => {
    let wrapper = (0, _util.findWrapper)(referencePath);

    if (wrapper) {
      const id = wrapper.scope.generateUidIdentifier('arg');

      const _referencePath$replac = referencePath.replaceWith(id),
            replacement = _referencePath$replac[0];

      const callee = (0, _util.findTargetCallee)(replacement);
      callee.setData('_.wasPlaceholder', true);
      wrapper.node.params.push(id);
      return;
    }

    let caller = (0, _util.findTargetCaller)(referencePath);
    let isAssign = false;

    if (!caller) {
      var _referencePath$findPa;

      const decl = (_referencePath$findPa = referencePath.findParent(_it => {
        return _it.isVariableDeclarator();
      })) !== null && _referencePath$findPa !== void 0 ? _referencePath$findPa : function (e) {
        throw e;
      }(new _util.PartialError('Placeholders must be used as function arguments or the\n' + 'right side of a variable declaration, ie. `const eq = _ === _`)'));
      isAssign = true;
      caller = decl.get('init');
      wrapper = (0, _util.findWrapper)(referencePath, true);
    }

    const id = caller.scope.generateUidIdentifier('arg');

    const _referencePath$replac2 = referencePath.replaceWith(id),
          replacement = _referencePath$replac2[0];

    replacement.setData('_.wasPlaceholder', true);

    if (wrapper) {
      wrapper.node.params.push(id);
      return;
    }

    if (!isAssign) {
      const replacementCallee = (0, _util.findTargetCallee)(replacement);
      replacementCallee.setData('_.wasPlaceholder', true);
      hoistTargets.push(caller);
    }

    const fn = t.arrowFunctionExpression([id], t.blockStatement([t.returnStatement(caller.node)]));

    const _caller$replaceWith = caller.replaceWith(fn),
          result = _caller$replaceWith[0];

    result.setData('_.wasPlaceholder', true);
  });
  hoistTargets.forEach((_arg) => {
    return (0, _util.hoistArguments)(t, _arg);
  });
}