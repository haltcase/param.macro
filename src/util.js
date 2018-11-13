import { _, it } from 'param.macro'

const nonHoistTypes = [
  'Identifier',
  'ArrayExpression',
  'ObjectExpression',
  'FunctionExpression',
  'ArrowFunctionExpression'
]

export class PartialError extends Error {
  constructor (message) {
    super(message)
    this.name = 'PartialError'

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor)
    } else if (!this.stack) {
      this.stack = new Error(message).stack
    }
  }
}

function isPipeline (path, child) {
  return (
    path.isBinaryExpression({ operator: '|>' }) &&
    (!child || path.get('right') === child)
  )
}

export function findParentUntil (path, pred, accumulate) {
  let link = path
  while (link?.parentPath) {
    const parent = link.parentPath
    const result = pred(parent, link)
    if (result === true) return link
    if (result) return result
    if (result === false) break
    link = parent
  }

  return accumulate ? link : null
}

export function findTargetAssignment (path) {
  let calls = 0
  return path |> findTopmostLink |> findParentUntil(_, (parent, link) => {
    if (parent.isCallExpression() && ++calls > 0) return false

    // parent.isObjectProperty() -> parent.get('value')
    if (parent.isVariableDeclarator()) {
      return parent.get('init')
    } else if (parent.isAssignmentPattern() || isPipeline(parent, link)) {
      return parent.get('right')
    }
  })
}

export function findTargetCallee (path) {
  return path.find(it.listKey === 'arguments')
}

export function findTargetCaller (path) {
  return findTargetCallee(path)?.parentPath
}

export function findTopmostLink (path) {
  return path |> findParentUntil(_, (parent, link) => {
    const isCalleeTail = () =>
      parent.isCallExpression() &&
      parent.get('callee') === link

    const isUnary = () =>
      parent.isUnaryExpression() &&
      parent.get('argument') === link

    const isBinary = () =>
      parent.isBinaryExpression() &&
      parent.node.operator !== '|>'

    if (
      !parent.isMemberExpression() &&
      !isBinary() &&
      !isCalleeTail() &&
      !isUnary()
    ) return false
  }, true)
}

export function findWrapper (path, noCallee) {
  const root = noCallee ? path : findTargetCallee(path)
  let calls = 0

  return root |> findParentUntil(_, (parent, link) => {
    if (
      isPipeline(parent, link) ||
      (parent.isCallExpression() && ++calls > 1)
    ) return false

    if (parent.isArrowFunctionExpression() && wasMacro(parent)) {
      return parent
    }
  })
}

export function hoistArguments (t, caller) {
  let args, upper
  if (caller.isArrowFunctionExpression()) {
    args = caller.get('body.body.0.argument.arguments')
    upper = caller.getStatementParent()
  } else if (caller.isCallExpression()) {
    args = caller.get('arguments')
    upper = caller
      .findParent(it.isArrowFunctionExpression())
      .getStatementParent()
  }

  if (!args?.length) return

  args.forEach(arg => {
    if (!shouldHoist(arg)) return

    const id = upper.scope.generateUidIdentifier('ref')
    const ref = t.variableDeclaration('const', [
      t.variableDeclarator(id, arg.node)
    ])
    upper.insertBefore(ref)
    arg.replaceWith(id)
  })
}

export function getParamNode (t, sourcePath, arg) {
  if (sourcePath.parentPath.isSpreadElement()) {
    return t.restElement(arg)
  } else {
    return arg
  }
}

export function markPlaceholder (path) {
  path.setData('_.wasPlaceholder', true)
}

export function shouldHoist (path) {
  const isTransformed = () =>
    path |> findTargetCallee |> wasMacro

  const hasMacroArgs = () =>
    path.isCallExpression() &&
    path.get('arguments').some(wasMacro(_))

  return (
    !path.isLiteral() &&
    nonHoistTypes.every(it !== path.node.type) &&
    !isTransformed() &&
    !hasMacroArgs()
  )
}

export function wasMacro (path) {
  return (
    path.getData('_.wasPlaceholder', false) ||
    path.getData('it.wasTransformed', false)
  )
}
