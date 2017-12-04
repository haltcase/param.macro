import test from 'ava'

import { transformSync } from '@babel/core'
import macros from 'babel-macros'
import $ from 'dedent'

function testMacro (t, input, expected) {
  const output = transformSync(input, {
    babelrc: false,
    plugins: [macros],
    filename: __filename,
  }).code.trim()

  t.is(output, expected)
}

test(
  'it: unused',
  testMacro,
  `import { it } from 'param.macro'`,
  ``
)

test(
  '_: unused',
  testMacro,
  `import { _ } from 'param.macro'`,
  ``
)

test(
  'it: default import is the same as `it` named import',
  testMacro,
  $`
    import it from 'param.macro'
    const identity = it
  `,
  $`
    const identity = _it => {
      return _it;
    };
  `
)

test(
  'it: aliased named import works',
  testMacro,
  $`
    import { it as IT } from 'param.macro'
    array.map(IT + ' sheckles')
  `,
  $`
    array.map(_it => {
      return _it + ' sheckles';
    });
  `
)

test(
  '_: aliased named import works',
  testMacro,
  $`
    import { _ as PLACEHOLDER } from 'param.macro'
    const toInt = parseInt(PLACEHOLDER, 10)
  `,
  $`
    const toInt = (_arg) => {
      return parseInt(_arg, 10);
    };
  `
)

test(
  'it: transforms `it` arguments to lambda parameters',
  testMacro,
  $`
    import { it } from 'param.macro'
    const arr = [1, 2, 3].map(it * 2)
  `,
  $`
    const arr = [1, 2, 3].map(_it => {
      return _it * 2;
    });
  `
)

test(
  'it: supports nested properties and methods',
  testMacro,
  $`
    import { it } from 'param.macro'
    const arr1 = array.map(it.foo.bar)
    const arr2 = array.map(it.foo.baz())
  `,
  $`
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
  testMacro,
  $`
    import { it } from 'param.macro'
    const arr = [1, 2, 3].map(it)
  `,
  $`
    const arr = [1, 2, 3].map(_it => {
      return _it;
    });
  `
)

test(
  'it: assignment is the identity function',
  testMacro,
  $`
    import { it } from 'param.macro'
    const identity = it
  `,
  $`
    const identity = _it => {
      return _it;
    };
  `
)

test(
  'it: multiple uses always refer to the first parameter',
  testMacro,
  $`
    import { it } from 'param.macro'
    fn(it + it + it * it)
  `,
  $`
    fn(_it => {
      return _it + _it + _it * _it;
    });
  `
)

test(
  '_: partially applies the called function',
  testMacro,
  $`
    import { _ } from 'param.macro'
    const log = console.log(_)
  `,
  $`
    const log = (_arg) => {
      return console.log(_arg);
    };
  `
)

test(
  '_: works with multiple placeholders',
  testMacro,
  $`
    import { _ } from 'param.macro'
    const log = console.log(_, 1, _, 2, _)
  `,
  $`
    const log = (_arg, _arg2, _arg3) => {
      return console.log(_arg, 1, _arg2, 2, _arg3);
    };
  `
)

test(
  '_: assigned expressions compile to a single function',
  testMacro,
  $`
    import { _ } from 'param.macro'
    const areSameThing = _ === _
    const oneMansIsAnothers = _.trash === _.treasure
  `,
  $`
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
  testMacro,
  $`
    import { _ } from 'param.macro'
    const log = console.log(_, {}, foo(), new Person(), 2, _.bar())
  `,
  $`
    const _ref = foo();

    const _ref2 = new Person();

    const log = (_arg, _arg2) => {
      return console.log(_arg, {}, _ref, _ref2, 2, _arg2.bar());
    };
  `
)

test(
  '_: does not hoist nested partial functions',
  testMacro,
  $`
    import { _ } from 'param.macro'
    const mapper = map(_, get(_, 'nested.key', 'default'))
  `,
  $`
    const mapper = (_arg) => {
      return map(_arg, (_arg2) => {
        return get(_arg2, 'nested.key', 'default');
      });
    };
  `
)

test(
  '_: supports nested properties and methods',
  testMacro,
  $`
    import { _ } from 'param.macro'
    console.log(_.foo.bar)
    console.log(_.foo.baz())
  `,
  $`
    (_arg) => {
      return console.log(_arg.foo.bar);
    };

    (_arg2) => {
      return console.log(_arg2.foo.baz());
    };
  `
)
