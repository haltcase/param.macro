import { _ } from 'param.macro'

import {
  PartialError,
  findTargetAssignment,
  findTargetCallee,
  findTargetCaller,
  findTopmostLink,
  findWrapper,
  hoistArguments,
  getParamNode,
  markPlaceholder
} from './util'

export default function transformPlaceholders (t, refs) {
  const hoistTargets = []

  refs.forEach(referencePath => {
    let wrapper = findWrapper(referencePath)

    if (wrapper) {
      const id = wrapper.scope.generateUidIdentifier('arg')
      const param = getParamNode(t, referencePath, id)
      referencePath.replaceWith(id)
      referencePath |> findTargetCallee |> markPlaceholder
      wrapper.node.params.push(param)
      return
    }

    let isAssign = true
    let caller = findTargetAssignment(referencePath)
    if (caller) {
      wrapper = findWrapper(referencePath, true)
    } else {
      isAssign = false
      caller = findTargetCaller(referencePath)
    }

    if (!caller) {
      throw new PartialError(
        'Placeholders must be used as function arguments or the\n' +
        'right side of a variable declaration, ie. `const eq = _ === _`)'
      )
    }

    const id = caller.scope.generateUidIdentifier('arg')
    const param = getParamNode(t, referencePath, id)
    referencePath.replaceWith(id)
    referencePath |> markPlaceholder

    if (wrapper) {
      wrapper.node.params.push(param)
      return
    }

    if (!isAssign) {
      referencePath |> findTargetCallee |> markPlaceholder
      hoistTargets.push(caller)
    }

    const tail = findTopmostLink(caller)
    const fn = t.arrowFunctionExpression(
      [param],
      t.blockStatement([
        t.returnStatement(tail.node)
      ])
    )

    tail.replaceWith(fn)
    tail |> markPlaceholder
  })

  hoistTargets.forEach(hoistArguments(t, _))
}
