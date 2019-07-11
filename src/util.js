import { _, it } from 'param.macro'

const nonHoistTypes = new Set([
  'Identifier',
  'ArrayExpression',
  'ObjectExpression',
  'FunctionExpression',
  'ArrowFunctionExpression'
])

const isPipeline = (path, child, side = 'right') => {
  if (side !== 'right' && side !== 'left') {
    throw new RangeError('Expected side to be one of "left" or "right"')
  }

  return (
    path.isBinaryExpression({ operator: '|>' }) &&
    (!child || path.get(side) === child)
  )
}

export const throwFrameError = (path, msg) => {
  throw path.buildCodeFrameError(`\n\n${msg}\n\n`)
}

export const markPlaceholder = path => {
  path && path.setData('_.wasPlaceholder', true)
}

export const wasMacro =
  it.getData('_.wasPlaceholder', false) ||
  it.getData('it.wasTransformed', false)

export const findTargetCallee =
  _.find(it.listKey === 'arguments')

export const findTargetCaller =
  findTargetCallee(_)?.parentPath

export const findParentUntil = (path, pred, accumulate) => {
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

export const findTargetExpression = (path, isImplicitParam = false) => {
  return path |> findTopmostLink |> findParentUntil(_, (parent, link) => {
    const isPipe = isPipeline(parent)
    if (isPipe && parent.get('right') === link) {
      return link
    } else if (isPipe && !isImplicitParam && parent.get('left') === link) {
      return parent
    } else if (parent.isVariableDeclarator()) {
      return parent.get('init')
    } else if (parent.isAssignmentPattern()) {
      return parent.get('right')
    } else if (parent.isAssignmentExpression()) {
      if (parent.parentPath.isExpressionStatement()) {
        return parent.get('right')
      }

      if (isImplicitParam) {
        return parent
      }

      return parent.parentPath
    }

    const key = link.listKey

    if (isImplicitParam) {
      if (
        key === 'expressions' &&
        parent.parentPath.isTaggedTemplateExpression()
      ) {
        return link
      } else if (key === 'arguments') {
        return link
      }
    } else {
      if (key === 'arguments') {
        return parent
      }
    }
  })
}

export const findTopmostLink = path => {
  return path |> findParentUntil(_, (parent, link) => {
    const isCalleeTail = () =>
      parent.isCallExpression() &&
      parent.get('callee') === link

    const isUnary = () =>
      parent.isUnaryExpression() &&
      parent.get('argument') === link

    const isBinary = () => {
      if (parent.isBinaryExpression()) {
        if (parent.node.operator === '|>') {
          return parent.get('left') === link
        }

        return true
      } else {
        return false
      }
    }

    if (
      !parent.isMemberExpression() &&
      !isBinary() &&
      !isCalleeTail() &&
      !isUnary()
    ) return false
  }, true)
}

export const findWrapper = path => {
  let calls = 0
  return path |> findParentUntil(_, (parent, link) => {
    if (
      isPipeline(parent, link) ||
      (parent.isCallExpression() && ++calls > 1)
    ) return false

    if (parent.isArrowFunctionExpression() && wasMacro(parent)) {
      return parent
    }
  })
}

export const shouldHoist = path => {
  const isTransformed = () =>
    path |> findTargetCallee |> wasMacro

  const hasMacroArgs = () =>
    path.isCallExpression() &&
    path.get('arguments').some(wasMacro(_))

  return (
    !path.isLiteral() &&
    !nonHoistTypes.has(path.node.type) &&
    !isTransformed() &&
    !hasMacroArgs()
  )
}

export const hoistArguments = (t, caller) => {
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

export const getParamNode = (t, sourcePath, arg) => {
  if (sourcePath.parentPath.isSpreadElement()) {
    return t.restElement(arg)
  } else {
    return arg
  }
}
