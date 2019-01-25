import {
  PartialError,
  findTargetExpression,
  findTargetCallee
} from './util'

export default function transformImplicitParams (t, refs) {
  refs.forEach(referencePath => {
    const parent =
      findTargetExpression(referencePath, true) ||
      findTargetCallee(referencePath)

    if (!parent) {
      throw new PartialError(
        'Implicit parameters must be used as function arguments or the\n' +
        'right side of a variable declaration, ie. `const identity = it`)'
      )
    }

    if (parent.getData('it.wasTransformed')) {
      // this scope already contains an implicit parameter
      // so we need to reuse that existing generated identifier
      parent.scope.rename(
        referencePath.node.name,
        parent.getData('it.idName')
      )
      return
    }

    // generate a new identifier and rename all references in this scope
    const id = parent.scope.generateUidIdentifier('it')
    parent.scope.rename(referencePath.node.name, id.name)

    // create an arrow function that wraps and returns the expression
    // generating an arrow maintains lexical `this`
    const fn = t.arrowFunctionExpression(
      [id],
      t.blockStatement([
        t.returnStatement(parent.node)
      ])
    )

    // replace the expression with the new wrapper that returns it
    parent.replaceWith(fn)

    // mark this as a former implicit parameter and record its identifier
    // other uses of the implicit parameter in this same scope
    // will reuse this identifier so they all refer to the same argument
    parent.setData('it.wasTransformed', true)
    parent.setData('it.idName', id.name)
  })
}
