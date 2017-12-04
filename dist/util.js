"use strict";

exports.__esModule = true;
exports.findTargetCallee = findTargetCallee;
exports.findTargetCaller = findTargetCaller;
exports.findWrapper = findWrapper;
exports.hoistArguments = hoistArguments;
exports.shouldHoist = shouldHoist;
exports.wasMacro = wasMacro;
exports.PartialError = void 0;
const nonHoistTypes = ['Identifier', 'ArrayExpression', 'ObjectExpression', 'FunctionExpression', 'ArrowFunctionExpression'];
let PartialError = class PartialError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PartialError';

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else if (!this.stack) {
      this.stack = new Error(message).stack;
    }
  }

};
exports.PartialError = PartialError;

function findTargetCallee(path) {
  if (path.listKey === 'arguments') {
    return path;
  }

  return path.findParent(_it => {
    return _it.listKey === 'arguments';
  });
}

function findTargetCaller(path) {
  var _findTargetCallee;

  return (_findTargetCallee = findTargetCallee(path)) === null || _findTargetCallee === void 0 ? void 0 : _findTargetCallee.parentPath;
}

function findWrapper(path, noCallee) {
  const root = noCallee ? path : findTargetCallee(path);
  let calls = 0;
  let link = root;

  while (link = (_link = link) === null || _link === void 0 ? void 0 : _link.parentPath) {
    var _link;

    if (link.isCallExpression()) calls++;
    if (calls > 1) break;

    if (link.isArrowFunctionExpression() && wasMacro(link)) {
      return link;
    }
  }

  return null;
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

function shouldHoist(path) {
  const isTransformed = () => {
    var _ref, _path;

    return _ref = (_path = path, findTargetCallee(_path)), wasMacro(_ref);
  };

  const hasMacroArgs = () => path.isCallExpression() && path.get('arguments').some((_arg) => {
    return wasMacro(_arg);
  });

  return !path.isLiteral() && nonHoistTypes.every(_it3 => {
    return _it3 !== path.node.type;
  }) && !isTransformed() && !hasMacroArgs();
}

function wasMacro(path) {
  return path.getData('_.wasPlaceholder', false) || path.getData('it.wasTransformed', false);
}