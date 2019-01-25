'use strict'

const transformImplicitParams = require('./dist/implicit-parameters').default
const transformPlaceholders = require('./dist/placeholders').default
const transformLift = require('./dist/lift').default
const { name } = require('./package.json')

const isPrimitive = val =>
  val == null || ['s', 'b', 'n'].indexOf((typeof val)[0]) >= 0

const looksLike = (a, b) =>
  a &&
  b &&
  Object.keys(b).every(bKey => {
    const bVal = b[bKey]
    const aVal = a[bKey]

    if (typeof bVal === 'function') {
      return bVal(aVal)
    }

    return isPrimitive(bVal)
      ? bVal === aVal
      : looksLike(aVal, bVal)
  })

const isImport = path => looksLike(path, {
  node: {
    source: {
      value: name
    }
  }
})

const isRequire = path => looksLike(path, {
  node: {
    callee: {
      type: 'Identifier',
      name: 'require'
    },
    arguments: args =>
      args.length === 1 && args[0] === name
  },
  parent: {
    type: 'VariableDeclarator'
  }
})

const applyPlugin = (babel, path, imports) => {
  let hasReferences = false

  const references = imports.reduce(
    (byName, { importedName, localName }) => {
      byName[importedName] = path.scope.getBinding(localName).referencePaths
      hasReferences = hasReferences || Boolean(byName[importedName].length)
      return byName
    },
    {}
  )

  if (!hasReferences) return

  if (references.it) transformImplicitParams(babel.types, references.it)
  if (references.default) transformImplicitParams(babel.types, references.default)
  if (references._) transformPlaceholders(babel.types, references._)
  if (references.lift) transformLift(babel.types, references.lift)
}

module.exports = babel => {
  return {
    name,
    visitor: {
      ImportDeclaration (path, state) {
        if (!isImport(path)) return

        const imports = path.node.specifiers.map(s => ({
          localName: s.local.name,
          importedName:
            s.type === 'ImportDefaultSpecifier' ? 'default' : s.imported.name
        }))

        applyPlugin(babel, path, imports)
        path.remove()
      },

      CallExpression (path, state) {
        if (!isRequire(path)) return

        const imports = path.parent.id.name
          ? [{ localName: path.parent.id.name, importedName: 'default' }]
          : path.parent.id.properties.map(property => ({
            localName: property.value.name,
            importedName: property.key.name
          }))

        applyPlugin(babel, path, imports)
        path.parentPath.remove()
      }
    }
  }
}
