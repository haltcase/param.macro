import it from 'param.macro'
import { findTargetCallee, PartialError } from './util'

export default function transformImplicitParams (t, refs) {
  refs.forEach(referencePath => {
    const parent =
      findTargetCallee(referencePath) ??
      referencePath.findParent(it.isVariableDeclarator())?.get('init')

    if (!parent) {
      throw new PartialError(
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

    parent.replaceWith(fn)
    parent.setData('it.wasTransformed', true)
    parent.setData('it.idName', id.name)
  })
}
