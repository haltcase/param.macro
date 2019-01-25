import { _ } from 'param.macro'

import {
  PartialError,
  findTargetExpression,
  findTargetCallee,
  findTopmostLink,
  findWrapper,
  hoistArguments,
  getParamNode,
  markPlaceholder
} from './util'

export default function transformPlaceholders (t, refs) {
  const hoistTargets = []

  refs.forEach(referencePath => {
    const caller = findTargetExpression(referencePath)

    if (!caller) {
      throw new PartialError(
        'Placeholders must be used as function arguments or the\n' +
        'right side of a variable declaration, ie. `const eq = _ === _`)'
      )
    }

    const callee = findTargetCallee(referencePath)
    const wrapper = findWrapper(callee) || findWrapper(referencePath)

    const id = caller.scope.generateUidIdentifier('arg')
    const param = getParamNode(t, referencePath, id)
    referencePath.replaceWith(id)
    referencePath |> markPlaceholder
    callee |> markPlaceholder

    if (wrapper) {
      wrapper.node.params.push(param)
      return
    }

    // track this as a location where parameters may need to be hoisted
    hoistTargets.push(caller)

    const tail = findTopmostLink(caller)
    const fn = t.arrowFunctionExpression(
      [param],
      t.blockStatement([
        t.returnStatement(tail.node)
      ])
    )

    // replace the expression with the new wrapper that returns it
    tail.replaceWith(fn)
    // mark the replacement so we can tell that it used to be a placeholder
    tail |> markPlaceholder
  })

  hoistTargets.forEach(hoistArguments(t, _))
}
