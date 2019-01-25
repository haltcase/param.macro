import test from 'ava'

import { _ } from 'param.macro'

import { transform as transform7 } from '@babel/core'
import { transform as transform6 } from 'babel-core'
import { runInNewContext } from 'vm'
import macros from 'babel-plugin-macros'
import dedent from 'dedent'
import { copy, remove } from 'fs-extra'

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

const evalPlugin = () => ({
  visitor: {
    Program (path) {
      const directive = path.get('directives.0')
      if (directive && directive.node.value.value === 'test') {
        directive.remove()
      }
    }
  }
})

const rewrittenImportSource = './macro'

const rewriteImportPlugin = () => {
  const isParamMacroString = path =>
    path.isStringLiteral({ value: 'param.macro' })

  const isCalleeRequire = path =>
    path.get('callee').isIdentifier({ name: 'require' })

  const transformImport = path => {
    const source = path.get('source')
    if (isParamMacroString(source)) {
      source.node.value = rewrittenImportSource
    }
  }

  const transformCallExpression = path => {
    const arg = path.get('arguments.0')
    if (!!arg && isCalleeRequire(path) && isParamMacroString(arg)) {
      arg.node.value = rewrittenImportSource
    }
  }

  return {
    visitor: {
      // using `Program` visitor so we can transform before other plugins
      Program (path) {
        const body = path.get('body').forEach(p => {
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
  }
}

const babel6 = (t, input, expected = ``) => {
  const output = input |> dedent |> transform6(_, {
    babelrc: false,
    plugins: [rewriteImportPlugin, macros, evalPlugin],
    filename: __filename,
    comments: false
  }).code.trim()

  t.is(
    output |> stripBlankLines,
    expected |> dedent |> stripBlankLines
  )
}

babel6.title = name => `(babel 6) ${name}`

const babel7 = async (t, input, expected = ``) => {
  const normalizedInput = dedent(input)

  const output = transform7(normalizedInput, {
    babelrc: false,
    plugins: [...syntaxPlugins, rewriteImportPlugin, macros, evalPlugin],
    filename: __filename
  }).code.trim()

  if (isRunnable(normalizedInput)) {
    transform7(normalizedInput, {
      babelrc: false,
      plugins: [rewriteImportPlugin, macros, evalPlugin, ...transformPlugins],
      filename: __filename
    }).code |> runInNewContext(_, { t })
  }

  t.is(
    output |> stripBlankLines,
    expected |> dedent |> stripBlankLines
  )
}

babel7.title = name => `(babel 7) ${name}`

const babel7Failure = async (t, input, expected) => {
  t.throws(() => {
    transform7(input, {
      babelrc: false,
      plugins: [...syntaxPlugins, rewriteImportPlugin, macros],
      filename: __filename
    })
  }, expected)
}

babel7Failure.title = name => `(babel 7) ${name}`

test.before(async () => {
  // copy `dist` to `macro` directory, which is what the plugin
  // above rewrites any `param.macro` imports to, so `babel-plugin-macros`
  // is aware that this is a macro when it looks at the import source
  await remove(rewrittenImportSource)
  await copy('./dist', rewrittenImportSource)
})

test(
  'it: unused',
  [babel7, babel6],
  `import { it } from 'param.macro'`,
  ``
)

test(
  'it: default import is the same as `it` named import',
  [babel7, babel6],
  `
    'test'
    import it from 'param.macro'
    const identity = it
    t.is(identity('hello'), 'hello')
  `,
  `
    const identity = _it => {
      return _it;
    };
    t.is(identity('hello'), 'hello');
  `
)

test(
  'it: aliased named import works',
  [babel7, babel6],
  `
    'test'
    import { it as IT } from 'param.macro'
    const array = ['1', '2', '3']
    const result = array.map(IT + ' sheckles')
    t.deepEqual(result, ['1 sheckles', '2 sheckles', '3 sheckles'])
  `,
  `
    const array = ['1', '2', '3'];
    const result = array.map(_it => {
      return _it + ' sheckles';
    });
    t.deepEqual(result, ['1 sheckles', '2 sheckles', '3 sheckles']);
  `
)

test(
  'it: transforms `it` arguments to lambda parameters',
  [babel7, babel6],
  `
    'test'
    import { it } from 'param.macro'
    const arr = [1, 2, 3].map(it * 2)
    t.deepEqual(arr, [2, 4, 6])
  `,
  `
    const arr = [1, 2, 3].map(_it => {
      return _it * 2;
    });
    t.deepEqual(arr, [2, 4, 6]);
  `
)

test(
  'it: supports nested properties and methods',
  [babel7, babel6],
  `
    import { it } from 'param.macro'
    const arr1 = array.map(it.foo.bar)
    const arr2 = array.map(it.foo.baz())
  `,
  `
    const arr1 = array.map(_it => {
      return _it.foo.bar;
    });
    const arr2 = array.map(_it2 => {
      return _it2.foo.baz();
    });
  `
)

test(
  'it: lone `it` results in the identity function',
  [babel7, babel6],
  `
    'test'
    import { it } from 'param.macro'
    const arr = [1, 2, 3].map(it)
    t.deepEqual(arr, [1, 2, 3])
  `,
  `
    const arr = [1, 2, 3].map(_it => {
      return _it;
    });
    t.deepEqual(arr, [1, 2, 3]);
  `
)

test(
  'it: simple assignment is the identity function',
  [babel7, babel6],
  `
    import { it } from 'param.macro'
    const identity = it
  `,
  `
    const identity = _it => {
      return _it;
    };
  `
)

test(
  'it: multiple uses always refer to the first parameter',
  [babel7, babel6],
  `
    import { it } from 'param.macro'
    fn(it + it + it * it)
  `,
  `
    fn(_it => {
      return _it + _it + _it * _it;
    });
  `
)

test(
  'it: supports default parameters',
  [babel7, babel6],
  `
    import { it } from 'param.macro'
    const fn = (a = it + it) => {}
  `,
  `
    const fn = (a = _it => {
      return _it + _it;
    }) => {};
  `
)

test(
  '_: unused',
  [babel7, babel6],
  `import { _ } from 'param.macro'`,
  ``
)

test(
  '_: partially applies the called function',
  [babel7, babel6],
  `
    'test'
    import { _ } from 'param.macro'
    const add = (x, y) => x + y
    const addOne = add(1, _)
    t.is(addOne(4), 5)
  `,
  `
    const add = (x, y) => x + y;
    const addOne = (_arg) => {
      return add(1, _arg);
    };
    t.is(addOne(4), 5);
  `
)

test(
  '_: aliased named import works',
  [babel7, babel6],
  `
    'test'
    import { _ as PLACEHOLDER } from 'param.macro'
    const toInt = parseInt(PLACEHOLDER, 10)
    t.is(toInt('2'), 2)
  `,
  `
    const toInt = (_arg) => {
      return parseInt(_arg, 10);
    };
    t.is(toInt('2'), 2);
  `
)

test(
  '_: works with multiple placeholders',
  [babel7, babel6],
  `
    import { _ } from 'param.macro'
    const log = console.log(_, 1, _, 2, _)
  `,
  `
    const log = (_arg, _arg2, _arg3) => {
      return console.log(_arg, 1, _arg2, 2, _arg3);
    };
  `
)

test(
  '_: assigned expressions compile to a single function',
  [babel7, babel6],
  `
    import { _ } from 'param.macro'
    const areSameThing = _ === _
    const oneMansIsAnothers = _.trash === _.treasure
  `,
  `
    const areSameThing = (_arg, _arg2) => {
      return _arg === _arg2;
    };

    const oneMansIsAnothers = (_arg3, _arg4) => {
      return _arg3.trash === _arg4.treasure;
    };
  `
)

test(
  '_: hoists complex sibling arguments to prevent multiple executions',
  [babel7, babel6],
  `
    import { _ } from 'param.macro'
    const log = console.log(_, {}, foo(), new Person(), 2, _.bar())
  `,
  `
    const _ref = foo();

    const _ref2 = new Person();

    const log = (_arg, _arg2) => {
      return console.log(_arg, {}, _ref, _ref2, 2, _arg2.bar());
    };
  `
)

test(
  '_: does not hoist nested partial functions',
  [babel7, babel6],
  `
    import { _ } from 'param.macro'
    const mapper = map(_, get(_, 'nested.key', 'default'))
  `,
  `
    const mapper = (_arg) => {
      return map(_arg, (_arg2) => {
        return get(_arg2, 'nested.key', 'default');
      });
    };
  `
)

test(
  '_: supports nested properties and methods',
  [babel7, babel6],
  `
    import { _ } from 'param.macro'
    console.log(_.foo.bar)
    console.log(_.foo.baz())
  `,
  `
    (_arg) => {
      return console.log(_arg.foo.bar);
    };

    (_arg2) => {
      return console.log(_arg2.foo.baz());
    };
  `
)

// can't test this in Babel 6 because the pipeline operator is Babel 7 only
test(
  '_: does not traverse out of pipelined expressions',
  [babel7],
  `
    'test'
    import { _, it } from 'param.macro'
    const add = (x, y) => x + y
    const fn = it |> parseInt |> add(10, _) |> String
    t.is(fn('100'), '110')
  `,
  `
    const add = (x, y) => x + y;

    const fn = _it => {
      return _it |> parseInt |> ((_arg) => {
        return add(10, _arg);
      }) |> String;
    };
    t.is(fn('100'), '110');
  `
)

test(
  '_: includes tail paths in the wrapper function',
  [babel7, babel6],
  `
    import { _ } from 'param.macro'
    const fn = String(_).toUpperCase() === 2
  `,
  `
    const fn = (_arg) => {
      return String(_arg).toUpperCase() === 2;
    };
  `
)

test(
  '_: handles hoisting correctly with tail paths',
  [babel7, babel6],
  `
    import { _, it } from 'param.macro'
    const Bar = class {}
    const fn = foo(_, new Bar()).toUpperCase() === 2
  `,
  `
    const Bar = class {};

    const _ref = new Bar();

    const fn = (_arg) => {
      return foo(_arg, _ref).toUpperCase() === 2;
    };
  `
)

test(
  '_: supports default parameters',
  [babel7, babel6],
  `
    'test'
    import { _ } from 'param.macro'
    const fn = (a = _ + _) => a(2, 2)
    t.is(fn(), 4)
  `,
  `
    const fn = (a = (_arg, _arg2) => {
      return _arg + _arg2;
    }) => a(2, 2);
    t.is(fn(), 4);
  `
)

test(
  '_: supports spread placeholders',
  [babel7, babel6],
  `
    import { _ } from 'param.macro'
    const log = console.log(..._)
  `,
  `
    const log = (..._arg) => {
      return console.log(..._arg);
    };
  `
)

test(
  '_: works normally within template expressions',
  [babel7, babel6],
  `
    import { _ } from 'param.macro'
    const a = style\`
      font-size: 16px;
      color: \${_.color};
    \`
  `,
  `
    const a = (_arg) => {
      return style\`
      font-size: 16px;
      color: \${_arg.color};
    \`;
    };
  `
)

test(
  'it: is transformed in place within a template expression',
  [babel7, babel6],
  `
    import it from 'param.macro'
    const a = style\`
      font-size: 16px;
      color: \${it.color};
    \`
  `,
  `
    const a = style\`
      font-size: 16px;
      color: \${_it => {
      return _it.color;
    }};
    \`;
  `
)

// can't test this in Babel 6 because the pipeline operator is Babel 7 only
test(
  'both: interoperates with pipeline operator',
  [babel7],
  `
    'test'
    import { _, it } from 'param.macro'

    const add = _ + _
    const tenPlusString =
      it
      |> parseInt(_, 10)
      |> add(10, _)
      |> String

    tenPlusString('10') |> t.is(_, '20')
  `,
  `
    const add = (_arg, _arg2) => {
      return _arg + _arg2;
    };

    const tenPlusString = _it => {
      return _it |> ((_arg3) => {
        return parseInt(_arg3, 10);
      }) |> ((_arg4) => {
        return add(10, _arg4);
      }) |> String;
    };

    tenPlusString('10') |> ((_arg5) => {
      return t.is(_arg5, '20');
    });
  `
)

test(
  'both: interoperates with pipeline operator part 2',
  [babel7],
  `
    'test'
    import { _, it } from 'param.macro'

    const heroes = [
      { name: 'bob' },
      { name: 'joe' },
      { name: 'ann' }
    ]

    heroes.map(it.name)
    |> _[0].split('')
    |> it.join(', ')
    |> \`-- \${_} --\`
    |> t.is(_, '-- b, o, b --')
  `,
  `
    const heroes = [{
      name: 'bob'
    }, {
      name: 'joe'
    }, {
      name: 'ann'
    }];
    heroes.map(_it => {
      return _it.name;
    }) |> ((_arg) => {
      return _arg[0].split('');
    }) |> (_it2 => {
      return _it2.join(', ');
    }) |> ((_arg2) => {
      return \`-- \${_arg2} --\`;
    }) |> ((_arg3) => {
      return t.is(_arg3, '-- b, o, b --');
    });
  `
)

test(
  'lift: allows for creating binary+ functions with placeholders',
  [babel7, babel6],
  `
    'test'
    import { _, lift } from 'param.macro'
    const result = [1, 2, 3, 4].reduce(lift(_ + _))
    t.is(result, 10)
  `,
  `
    const result = [1, 2, 3, 4].reduce((_arg, _arg2) => {
      return _arg + _arg2;
    });
    t.is(result, 10);
  `
)

test(
  'lift: `it` implicit parameters are functionally unaffected',
  [babel7, babel6],
  `
    'test'
    import { it, lift } from 'param.macro'
    const result = [1, 2, 3, 4].reduce(lift(it + it))
    t.is(result, 8)
  `,
  `
    const result = [1, 2, 3, 4].reduce(_it => {
      return _it + _it;
    });
    t.is(result, 8);
  `
)

test(
  'lift: is just elided in non-macro expressions',
  [babel7, babel6],
  `
    'test'
    import { lift } from 'param.macro'
    t.is(lift(1 + 1), 2)
  `,
  `
    t.is(1 + 1, 2);
  `
)

test(
  '_: pipeline is considered a tail path when `_` is in the left node',
  [babel7],
  `
    'test'
    import { _, it } from 'param.macro'
    const fn = someFn => someFn('world')
    const inner = name => ({ name })
    const otherFn = str => str.toUpperCase()
    const result = fn(inner(_).name |> otherFn)
    t.is(result, 'WORLD')
  `,
  `
    const fn = someFn => someFn('world');

    const inner = name => ({
      name
    });

    const otherFn = str => str.toUpperCase();

    const result = fn((_arg) => {
      return inner(_arg).name |> otherFn;
    });

    t.is(result, 'WORLD');
  `
)

test(
  '_, it: assignment expressions are applied similarly to declarations',
  [babel7, babel6],
  `
    import { _, it } from 'param.macro'
    const bar = {}
    bar.greet = \`Hello \${_}\`
    const result = bar.greet('world')
    t.is(result, 'Hello world')
  `,
  `
    const bar = {};

    bar.greet = (_arg) => {
      return \`Hello \${_arg}\`;
    };

    const result = bar.greet('world');
    t.is(result, 'Hello world');
  `
)

test(
  'it: fails when used outside of a valid expression (pt. 1)',
  [babel7Failure],
  `
    import it from 'param.macro'
    it
  `,
  { message: /Implicit parameters must be used/ }
)

test(
  'it: fails when used outside of a valid expression (pt. 2)',
  [babel7Failure],
  `
    import it from 'param.macro'
    it.property
  `,
  { message: /Implicit parameters must be used/ }
)

test(
  '_: fails when used outside of a valid expression (pt. 1)',
  [babel7Failure],
  `
    import { _ } from 'param.macro'
    _
  `,
  { message: /Placeholders must be used/ }
)

test(
  '_: fails when used outside of a valid expression (pt. 2)',
  [babel7Failure],
  `
    import { _ } from 'param.macro'
    _.property
  `,
  { message: /Placeholders must be used/ }
)
