import { _ } from 'param.macro'

import { join } from 'path'
import { runInNewContext } from 'vm'

import { transform as transform7 } from '@babel/core'
import { transform as transform6 } from 'babel-core'
import macros from 'babel-plugin-macros'
import dedent from 'dedent'

import evalPlugin from './plugin-eval'
import rewriteImportsPlugin, { rewrittenImportSource } from './plugin-rewrite-imports'

export { rewrittenImportSource }

const pluginPath = join(process.cwd(), 'plugin.js')

const blankLines = /(^[ \t]*\n)/gm

// Babel 6 & Babel 7 have different line breaks in output code
// using this ensures the output is the same between the two
const stripBlankLines = _.replace(blankLines, '')

const syntaxPlugins = [
  ['@babel/plugin-syntax-pipeline-operator', {
    proposal: 'minimal'
  }]
]

const transformPlugins = [
  ['@babel/plugin-proposal-pipeline-operator', {
    proposal: 'minimal'
  }]
]

const isRunnable = _.startsWith(`'test'`)

const makeBabel6Macro = (title, plugins) => {
  const macro = (t, input, expected = ``) => {
    const output = input |> dedent |> transform6(_, {
      babelrc: false,
      plugins,
      filename: __filename,
      comments: false
    }).code.trim()

    t.is(
      output |> stripBlankLines,
      expected |> dedent |> stripBlankLines
    )
  }

  macro.title = title
  return macro
}

const makeBabel7Macro = (title, plugins) => {
  const macro = async (t, input, expected = ``) => {
    const normalizedInput = dedent(input)

    const output = transform7(normalizedInput, {
      babelrc: false,
      plugins: [...syntaxPlugins, rewriteImportsPlugin, macros, evalPlugin],
      filename: __filename
    }).code.trim()

    t.is(
      output |> stripBlankLines,
      expected |> dedent |> stripBlankLines
    )

    if (isRunnable(normalizedInput)) {
      transform7(normalizedInput, {
        babelrc: false,
        plugins: [rewriteImportsPlugin, macros, evalPlugin, ...transformPlugins],
        filename: __filename
      }).code |> runInNewContext(_, { t })
    }
  }

  macro.title = title
  return macro
}

export const babel6 = makeBabel6Macro(
  name => `(babel 6) ${name}`,
  [rewriteImportsPlugin, macros, evalPlugin]
)

export const babel6Plugin = makeBabel6Macro(
  name => `(babel 6 plugin) ${name}`,
  [pluginPath, evalPlugin]
)

export const babel7 = makeBabel7Macro(
  name => `(babel 7) ${name}`,
  [...syntaxPlugins, rewriteImportsPlugin, macros, evalPlugin]
)

export const babel7Plugin = makeBabel7Macro(
  name => `(babel 7 plugin) ${name}`,
  [...syntaxPlugins, pluginPath, evalPlugin]
)

export const babel7Failure = async (t, input, expected) => {
  t.throws(() => {
    transform7(input, {
      babelrc: false,
      plugins: [...syntaxPlugins, rewriteImportsPlugin, macros],
      filename: __filename
    })
  }, expected)
}

babel7Failure.title = name => `(babel 7) ${name}`
