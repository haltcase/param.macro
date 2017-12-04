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

export function findTargetCallee (path) {
  if (path.listKey === 'arguments') {
    return path
  }

  return path.findParent(it.listKey === 'arguments')
}

export function findTargetCaller (path) {
  return findTargetCallee(path)?.parentPath
}

export function findWrapper (path, noCallee) {
  const root = noCallee ? path : findTargetCallee(path)

  let calls = 0
  let link = root
  while ((link = link?.parentPath)) {
    if (link.isCallExpression()) calls++
    if (calls > 1) break

    if (link.isArrowFunctionExpression() && wasMacro(link)) {
      return link
    }
  }

  return null
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
