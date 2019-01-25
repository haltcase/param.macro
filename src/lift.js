import { PartialError } from './util'

export default function transformLift (t, refs) {
  refs.forEach(referencePath => {
    const { parentPath } = referencePath

    if (!parentPath.isCallExpression()) {
      throw new PartialError('`lift` can only be used as a call expression')
    }

    const args = parentPath.get('arguments')

    if (args.length !== 1) {
      throw new PartialError('`lift` accepts a single expression as its only argument')
    }

    // `lift` exists simply to stop upward traversal of placeholders
    // which at this point have already been transformed, so we just
    // remove the `lift` call and replace it with its argument
    parentPath.replaceWith(args[0])
  })
}
