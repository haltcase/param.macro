import test from 'ava'

import * as macros from './helpers/macros'

test(
  'plugin(it): works like the macro',
  [macros.babel7Plugin, macros.babel6Plugin],
  `
    'test'
    import it from 'param.macro'
    const square = it * it
    t.is(square(2), 4)

    const getDeepFoo = it.nested.deep.property.foo
    const obj = {
      nested: {
        deep: {
          property: {
            foo: 'ayy'
          }
        }
      }
    }
    t.is(getDeepFoo(obj), 'ayy')
  `,
  `
    const square = _it => {
      return _it * _it;
    };
    t.is(square(2), 4);

    const getDeepFoo = _it2 => {
      return _it2.nested.deep.property.foo;
    };
    const obj = {
      nested: {
        deep: {
          property: {
            foo: 'ayy'
          }
        }
      }
    };
    t.is(getDeepFoo(obj), 'ayy');
  `
)

test(
  'plugin(_): works like the macro',
  [macros.babel7Plugin, macros.babel6Plugin],
  `
    'test'
    import { _ } from 'param.macro'
    const multiply = _ * _
    const timesTwo = multiply(2, _)
    t.is(timesTwo(9), 18)

    const greet = \`Hello \${_}\`
    t.is(greet('world'), 'Hello world')
  `,
  `
    const multiply = (_arg, _arg2) => {
      return _arg * _arg2;
    };
    const timesTwo = (_arg3) => {
      return multiply(2, _arg3);
    };
    t.is(timesTwo(9), 18);

    const greet = (_arg4) => {
      return \`Hello \${_arg4}\`;
    };
    t.is(greet('world'), 'Hello world');
  `
)

test(
  'plugin(lift): works like the macro',
  [macros.babel7Plugin, macros.babel6Plugin],
  `
    'test'
    import { _, it, lift } from 'param.macro'
    const result = [1, 2, 3, 4].reduce(lift(_ + _))
    t.is(result, 10)
    const result2 = [1, 2, 3, 4].reduce(lift(it + it))
    t.is(result2, 8)
    t.is(lift(1 + 1), 2)
  `,
  `
    const result = [1, 2, 3, 4].reduce((_arg, _arg2) => {
      return _arg + _arg2;
    });
    t.is(result, 10);
    const result2 = [1, 2, 3, 4].reduce(_it => {
      return _it + _it;
    });
    t.is(result2, 8);
    t.is(1 + 1, 2);
  `
)
