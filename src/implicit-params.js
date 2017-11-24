import it from 'partial-application.macro'
import { MacroError } from 'babel-macros'
import { findTargetCallee } from './util'

export default function transformImplicitParams (t, refs) {
  refs.forEach(referencePath => {
    const parent =
      findTargetCallee(referencePath) ??
      referencePath.findParent(it.isVariableDeclarator())?.get('init')

    if (!parent) {
      throw new MacroError(
        'Implicit parameters must be used as function arguments or the\n' +
        'right side of a variable declaration, ie. `const identity = it`)'
      )
    }

    if (parent.getData('it.wasTransformed')) {
      parent.scope.rename(
        referencePath.node.name,
        parent.getData('it.idName')
      )
      return
    }

    const id = parent.scope.generateUidIdentifier('it')
    parent.scope.rename(referencePath.node.name, id.name)

    const fn = t.arrowFunctionExpression(
      [id],
      t.blockStatement([
        t.returnStatement(parent.node)
      ])
    )

    const [result] = parent.replaceWith(fn)
    result.setData('it.wasTransformed', true)
    result.setData('it.idName', id.name)
  })
}
