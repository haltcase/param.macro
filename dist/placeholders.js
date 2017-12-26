"use strict";

exports.__esModule = true;
exports.default = transformPlaceholders;

var _util = require("./util");

function transformPlaceholders(t, refs) {
  const hoistTargets = [];
  refs.forEach(referencePath => {
    var _referencePath2, _tail;

    let wrapper = (0, _util.findWrapper)(referencePath);

    if (wrapper) {
      var _ref, _referencePath;

      const id = wrapper.scope.generateUidIdentifier('arg');
      const param = (0, _util.getParamNode)(t, referencePath, id);
      referencePath.replaceWith(id);
      _ref = (_referencePath = referencePath, (0, _util.findTargetCallee)(_referencePath)), (0, _util.markPlaceholder)(_ref);
      wrapper.node.params.push(param);
      return;
    }

    let isAssign = true;
    let caller = (0, _util.findTargetAssignment)(referencePath);

    if (caller) {
      wrapper = (0, _util.findWrapper)(referencePath, true);
    } else {
      isAssign = false;
      caller = (0, _util.findTargetCaller)(referencePath);
    }

    if (!caller) {
      throw new _util.PartialError('Placeholders must be used as function arguments or the\n' + 'right side of a variable declaration, ie. `const eq = _ === _`)');
    }

    const id = caller.scope.generateUidIdentifier('arg');
    const param = (0, _util.getParamNode)(t, referencePath, id);
    referencePath.replaceWith(id);
    _referencePath2 = referencePath, (0, _util.markPlaceholder)(_referencePath2);

    if (wrapper) {
      wrapper.node.params.push(param);
      return;
    }

    if (!isAssign) {
      var _ref2, _referencePath3;

      _ref2 = (_referencePath3 = referencePath, (0, _util.findTargetCallee)(_referencePath3)), (0, _util.markPlaceholder)(_ref2);
      hoistTargets.push(caller);
    }

    const tail = (0, _util.findTopmostLink)(caller);
    const fn = t.arrowFunctionExpression([param], t.blockStatement([t.returnStatement(tail.node)]));
    tail.replaceWith(fn);
    _tail = tail, (0, _util.markPlaceholder)(_tail);
  });
  hoistTargets.forEach((_arg) => {
    return (0, _util.hoistArguments)(t, _arg);
  });
}