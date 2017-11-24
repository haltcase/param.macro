import { _, it } from 'partial-application.macro'
import { MacroError } from 'babel-macros'

import {
  findTargetCallee,
  findTargetCaller,
  findWrapper,
  hoistArguments
} from './util'

export default function transformPlaceholders (t, refs) {
  const hoistTargets = []

  refs.forEach(referencePath => {
    const wrapper = findWrapper(referencePath)

    if (wrapper) {
      const id = wrapper.scope.generateUidIdentifier('arg')
      const [replacement] = referencePath.replaceWith(id)
      const callee = findTargetCallee(replacement)
      callee.setData('_.wasPlaceholder', true)
      wrapper.node.params.push(id)
      return
    }

    let caller = findTargetCaller(referencePath)
    let isAssign = false
    if (!caller) {
      const decl = referencePath.findParent(it.isVariableDeclarator())
      if (!decl) {
        throw new MacroError(
          'Placeholders must be used as function arguments or the\n' +
          'right side of a variable declaration, ie. `const eq = _ === _`)'
        )
      }

      isAssign = true
      caller = decl.get('init')
    }

    const id = caller.scope.generateUidIdentifier('arg')
    const [replacement] = referencePath.replaceWith(id)
    replacement.setData('_.wasPlaceholder', true)

    if (!isAssign) {
      const replacementCallee = findTargetCallee(replacement)
      replacementCallee.setData('_.wasPlaceholder', true)

      hoistTargets.push(caller)
    }


    const fn = t.arrowFunctionExpression(
      [id],
      t.blockStatement([
        t.returnStatement(caller.node)
      ])
    )

    const [result] = caller.replaceWith(fn)
    result.setData('_.wasPlaceholder', true)
  })

  hoistTargets.forEach(hoistArguments(t, _))
}
