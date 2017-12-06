import { _, it } from 'param.macro'

import {
  PartialError,
  findTargetCallee,
  findTargetCaller,
  findWrapper,
  hoistArguments
} from './util'

export default function transformPlaceholders (t, refs) {
  const hoistTargets = []

  refs.forEach(referencePath => {
    let wrapper = findWrapper(referencePath)

    if (wrapper) {
      const id = wrapper.scope.generateUidIdentifier('arg')
      referencePath.replaceWith(id)
      const callee = findTargetCallee(referencePath)
      callee.setData('_.wasPlaceholder', true)
      wrapper.node.params.push(id)
      return
    }

    let caller = findTargetCaller(referencePath)
    let isAssign = false
    if (!caller) {
      const decl =
        referencePath.findParent(it.isVariableDeclarator()) ??
        throw new PartialError(
          'Placeholders must be used as function arguments or the\n' +
          'right side of a variable declaration, ie. `const eq = _ === _`)'
        )

      isAssign = true
      caller = decl.get('init')
      wrapper = findWrapper(referencePath, true)
    }

    const id = caller.scope.generateUidIdentifier('arg')
    referencePath.replaceWith(id)
    referencePath.setData('_.wasPlaceholder', true)

    if (wrapper) {
      wrapper.node.params.push(id)
      return
    }

    if (!isAssign) {
      const replacementCallee = findTargetCallee(referencePath)
      replacementCallee.setData('_.wasPlaceholder', true)

      hoistTargets.push(caller)
    }

    const fn = t.arrowFunctionExpression(
      [id],
      t.blockStatement([
        t.returnStatement(caller.node)
      ])
    )

    caller.replaceWith(fn)
    caller.setData('_.wasPlaceholder', true)
  })

  hoistTargets.forEach(hoistArguments(t, _))
}
