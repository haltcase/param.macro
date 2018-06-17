"use strict";

exports.__esModule = true;
exports.findParentUntil = findParentUntil;
exports.findTargetAssignment = findTargetAssignment;
exports.findTargetCallee = findTargetCallee;
exports.findTargetCaller = findTargetCaller;
exports.findTopmostLink = findTopmostLink;
exports.findWrapper = findWrapper;
exports.hoistArguments = hoistArguments;
exports.getParamNode = getParamNode;
exports.markPlaceholder = markPlaceholder;
exports.shouldHoist = shouldHoist;
exports.wasMacro = wasMacro;
exports.PartialError = void 0;
const nonHoistTypes = ['Identifier', 'ArrayExpression', 'ObjectExpression', 'FunctionExpression', 'ArrowFunctionExpression'];

class PartialError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PartialError';

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else if (!this.stack) {
      this.stack = new Error(message).stack;
    }
  }

}

exports.PartialError = PartialError;

function isPipeline(path, child) {
  return path.isBinaryExpression({
    operator: '|>'
  }) && (!child || path.get('right') === child);
}

function findParentUntil(path, pred, accumulate) {
  let link = path;

  while ((_link = link) === null || _link === void 0 ? void 0 : _link.parentPath) {
    var _link;

    const parent = link.parentPath;
    const result = pred(parent, link);
    if (result === true) return link;
    if (result) return result;
    if (result === false) break;
    link = parent;
  }

  return accumulate ? link : null;
}

function findTargetAssignment(path) {
  var _ref, _path;

  let calls = 0;
  return _ref = (_path = path, findTopmostLink(_path)), ((_arg) => {
    return findParentUntil(_arg, (parent, link) => {
      if (isPipeline(parent, link)) return false;
      if (parent.isCallExpression() && ++calls > 0) return false; // parent.isObjectProperty() -> parent.get('value')

      if (parent.isVariableDeclarator()) {
        return parent.get('init');
      } else if (parent.isAssignmentPattern()) {
        return parent.get('right');
      }
    });
  })(_ref);
}

function findTargetCallee(path) {
  return path.find(_it => {
    return _it.listKey === 'arguments';
  });
}

function findTargetCaller(path) {
  var _findTargetCallee;

  return (_findTargetCallee = findTargetCallee(path)) === null || _findTargetCallee === void 0 ? void 0 : _findTargetCallee.parentPath;
}

function findTopmostLink(path) {
  var _path2;

  return _path2 = path, ((_arg2) => {
    return findParentUntil(_arg2, (parent, link) => {
      const isCalleeTail = () => parent.isCallExpression() && parent.get('callee') === link;

      const isUnary = () => parent.isUnaryExpression() && parent.get('argument') === link;

      const isBinary = () => parent.isBinaryExpression() && parent.node.operator !== '|>';

      if (!parent.isMemberExpression() && !isBinary() && !isCalleeTail() && !isUnary()) return false;
    }, true);
  })(_path2);
}

function findWrapper(path, noCallee) {
  var _root;

  const root = noCallee ? path : findTargetCallee(path);
  let calls = 0;
  return _root = root, ((_arg3) => {
    return findParentUntil(_arg3, (parent, link) => {
      if (isPipeline(parent, link) || parent.isCallExpression() && ++calls > 1) return false;

      if (parent.isArrowFunctionExpression() && wasMacro(parent)) {
        return parent;
      }
    });
  })(_root);
}

function hoistArguments(t, caller) {
  var _args;

  let args, upper;

  if (caller.isArrowFunctionExpression()) {
    args = caller.get('body.body.0.argument.arguments');
    upper = caller.getStatementParent();
  } else if (caller.isCallExpression()) {
    args = caller.get('arguments');
    upper = caller.findParent(_it2 => {
      return _it2.isArrowFunctionExpression();
    }).getStatementParent();
  }

  if (!((_args = args) === null || _args === void 0 ? void 0 : _args.length)) return;
  args.forEach(arg => {
    if (!shouldHoist(arg)) return;
    const id = upper.scope.generateUidIdentifier('ref');
    const ref = t.variableDeclaration('const', [t.variableDeclarator(id, arg.node)]);
    upper.insertBefore(ref);
    arg.replaceWith(id);
  });
}

function getParamNode(t, sourcePath, arg) {
  if (sourcePath.parentPath.isSpreadElement()) {
    return t.restElement(arg);
  } else {
    return arg;
  }
}

function markPlaceholder(path) {
  path.setData('_.wasPlaceholder', true);
}

function shouldHoist(path) {
  const isTransformed = () => {
    var _ref2, _path3;

    return _ref2 = (_path3 = path, findTargetCallee(_path3)), wasMacro(_ref2);
  };

  const hasMacroArgs = () => path.isCallExpression() && path.get('arguments').some((_arg4) => {
    return wasMacro(_arg4);
  });

  return !path.isLiteral() && nonHoistTypes.every(_it3 => {
    return _it3 !== path.node.type;
  }) && !isTransformed() && !hasMacroArgs();
}

function wasMacro(path) {
  return path.getData('_.wasPlaceholder', false) || path.getData('it.wasTransformed', false);
}