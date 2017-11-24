import { MacroError } from 'babel-macros'
import { findTargetCallee } from './util'

export default function transformImplicitParams (t, refs) {
  refs.forEach(referencePath => {
    if (referencePath.parentPath.isVariableDeclarator()) {
      const id = referencePath.scope.generateUidIdentifier('it')
      const identity = t.arrowFunctionExpression([id], id)
      referencePath.replaceWith(identity)
      return
    }

    const parent = findTargetCallee(referencePath)
    if (!parent) {
      throw new MacroError(
        'Implicit parameters must be used as function arguments or the\n' +
        'right side of a variable declaration, ie. `const identity = it`)'
      )
    }

    if (parent.getData('it.wasTransformed')) {
      referencePath.scope.rename(
        referencePath.node.name,
        parent.getData('it.idName')
      )
      return
    }

    const id = referencePath.scope.generateUidIdentifier('it')
    referencePath.scope.rename(referencePath.node.name, id.name)

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
