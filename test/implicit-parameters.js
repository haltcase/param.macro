import test from 'ava'

import * as macros from './helpers/macros'

test(
  'it: unused',
  [macros.babel7, macros.babel6],
  `import { it } from 'param.macro'`,
  ``
)

test(
  'it: default import is the same as `it` named import',
  [macros.babel7, macros.babel6],
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
  [macros.babel7, macros.babel6],
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
  [macros.babel7, macros.babel6],
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
  [macros.babel7, macros.babel6],
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
  [macros.babel7, macros.babel6],
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
  [macros.babel7, macros.babel6],
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
  [macros.babel7, macros.babel6],
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
  [macros.babel7, macros.babel6],
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
  'it: is transformed in place within a template expression',
  [macros.babel7, macros.babel6],
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

test(
  'it: fails when used outside of a valid expression (pt. 1)',
  [macros.babel7Failure],
  `
    import it from 'param.macro'
    it
  `,
  { message: /Implicit parameters must be used/ }
)

test(
  'it: fails when used outside of a valid expression (pt. 2)',
  [macros.babel7Failure],
  `
    import it from 'param.macro'
    it.property
  `,
  { message: /Implicit parameters must be used/ }
)
