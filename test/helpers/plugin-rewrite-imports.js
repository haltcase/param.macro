import { join } from 'path'

export const rewrittenImportSource = './macro'

const macroSource = join(process.cwd(), rewrittenImportSource)

const isParamMacroString = path =>
  path.isStringLiteral({ value: 'param.macro' })

const isCalleeRequire = path =>
  path.get('callee').isIdentifier({ name: 'require' })

const transformImport = path => {
  const source = path.get('source')
  if (isParamMacroString(source)) {
    source.node.value = macroSource
  }
}

const transformCallExpression = path => {
  const arg = path.get('arguments.0')
  if (!!arg && isCalleeRequire(path) && isParamMacroString(arg)) {
    arg.node.value = macroSource
  }
}

export default () => ({
  visitor: {
    // using `Program` visitor so we can transform before other plugins
    Program (path) {
      path.get('body').forEach(p => {
        if (p.isImportDeclaration()) {
          transformImport(p)
        } else if (p.isVariableDeclaration()) {
          const init = p.get('declarations.0.init')
          if (init.isCallExpression()) {
            transformCallExpression(init)
          }
        }
      })
    }
  }
})
