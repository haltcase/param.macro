import test from 'ava'

import * as macros from './helpers/macros'

test(
  '_: unused',
  [macros.babel7, macros.babel6],
  `import { _ } from 'param.macro'`,
  ``
)

test(
  '_: partially applies the called function',
  [macros.babel7, macros.babel6],
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
  [macros.babel7, macros.babel6],
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
  [macros.babel7, macros.babel6],
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
  [macros.babel7, macros.babel6],
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
  [macros.babel7, macros.babel6],
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
  [macros.babel7, macros.babel6],
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
  [macros.babel7, macros.babel6],
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
  [macros.babel7],
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
  [macros.babel7, macros.babel6],
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
  [macros.babel7, macros.babel6],
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
  [macros.babel7, macros.babel6],
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
  [macros.babel7, macros.babel6],
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
  [macros.babel7, macros.babel6],
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
  '_: pipeline is considered a tail path when `_` is in the left node',
  [macros.babel7],
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
  '_: fails when used outside of a valid expression (pt. 1)',
  [macros.babel7Failure],
  `
    import { _ } from 'param.macro'
    _
  `,
  { message: /Placeholders must be used/ }
)

test(
  '_: fails when used outside of a valid expression (pt. 2)',
  [macros.babel7Failure],
  `
    import { _ } from 'param.macro'
    _.property
  `,
  { message: /Placeholders must be used/ }
)
