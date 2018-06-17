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

    parentPath.replaceWith(args[0])
  })
}
