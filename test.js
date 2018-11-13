import test from 'ava'

import { transform as transform7 } from '@babel/core'
import { transform as transform6 } from 'babel-core'
import macros from 'babel-plugin-macros'
import dedent from 'dedent'

const blankLines = /(^[ \t]*\n)/gm

// Babel 6 & Babel 7 have different line breaks in output code
// using this ensures the output is the same between the two
const stripBlankLines = code => code.replace(blankLines, '')

const syntaxPlugins = [
  ['@babel/plugin-syntax-pipeline-operator', {
    proposal: 'minimal'
  }]
]

const babel6 = (t, input, expected = ``) => {
  const normalizedInput = dedent(input)
  const output = transform6(normalizedInput, {
    babelrc: false,
    plugins: [macros],
    filename: __filename
  }).code.trim()

  t.is(stripBlankLines(output), stripBlankLines(dedent(expected)))
}

babel6.title = name => `(babel 6) ${name}`

const babel7 = async (t, input, expected = ``) => {
  const normalizedInput = dedent(input)
  const output = transform7(normalizedInput, {
    babelrc: false,
    plugins: [...syntaxPlugins, macros],
    filename: __filename
  }).code.trim()

  t.is(stripBlankLines(output), stripBlankLines(dedent(expected)))
}

babel7.title = name => `(babel 7) ${name}`

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
    import it from 'param.macro'
    const identity = it
  `,
  `
    const identity = _it => {
      return _it;
    };
  `
)

test(
  'it: aliased named import works',
  [babel7, babel6],
  `
    import { it as IT } from 'param.macro'
    array.map(IT + ' sheckles')
  `,
  `
    array.map(_it => {
      return _it + ' sheckles';
    });
  `
)

test(
  'it: transforms `it` arguments to lambda parameters',
  [babel7, babel6],
  `
    import { it } from 'param.macro'
    const arr = [1, 2, 3].map(it * 2)
  `,
  `
    const arr = [1, 2, 3].map(_it => {
      return _it * 2;
    });
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
    import { it } from 'param.macro'
    const arr = [1, 2, 3].map(it)
  `,
  `
    const arr = [1, 2, 3].map(_it => {
      return _it;
    });
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
    import { _ } from 'param.macro'
    const log = console.log(_)
  `,
  `
    const log = (_arg) => {
      return console.log(_arg);
    };
  `
)

test(
  '_: aliased named import works',
  [babel7, babel6],
  `
    import { _ as PLACEHOLDER } from 'param.macro'
    const toInt = parseInt(PLACEHOLDER, 10)
  `,
  `
    const toInt = (_arg) => {
      return parseInt(_arg, 10);
    };
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
    import { _, it } from 'param.macro'
    const add = (x, y) => x + y
    const fn = it |> parseInt |> add(10, _) |> String
  `,
  `
    const add = (x, y) => x + y;

    const fn = _it => {
      return _it |> parseInt |> ((_arg) => {
        return add(10, _arg);
      }) |> String;
    };
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
    import { _ } from 'param.macro'
    const fn = (a = _ + _) => {}
  `,
  `
    const fn = (a = (_arg, _arg2) => {
      return _arg + _arg2;
    }) => {};
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

// can't test this in Babel 6 because the pipeline operator is Babel 7 only
test(
  'both: interoperates with pipeline operator',
  [babel7],
  `
    import { _, it } from 'param.macro'

    const add = _ + _
    const tenPlusString =
      it
      |> parseInt(_, 10)
      |> add(10, _)
      |> String

    tenPlusString('10') |> console.log
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

    tenPlusString('10') |> console.log;
  `
)

test(
  'both: interoperates with pipeline operator part 2',
  [babel7],
  `
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
    |> console.log
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
    }) |> console.log;
  `
)

test(
  'lift: allows for creating binary+ functions with placeholders',
  [babel7, babel6],
  `
    import { _, lift } from 'param.macro'
    ;[1, 2, 3, 4].reduce(lift(_ + _))
  `,
  `
    [1, 2, 3, 4].reduce((_arg, _arg2) => {
      return _arg + _arg2;
    });
  `
)

test(
  'lift: `it` implicit parameters are functionally unaffected',
  [babel7, babel6],
  `
    import { it, lift } from 'param.macro'
    ;[1, 2, 3, 4].reduce(lift(it + it))
  `,
  `
    [1, 2, 3, 4].reduce(_it => {
      return _it + _it;
    });
  `
)

test(
  'lift: is just elided in non-macro expressions',
  [babel7, babel6],
  `
    import { lift } from 'param.macro'
    console.log(lift(1 + 1))
  `,
  `
    console.log(1 + 1);
  `
)
