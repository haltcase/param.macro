import test from 'ava'

import * as macros from './helpers/macros'

test(
  '_, it: interoperates with pipeline operator',
  [macros.babel7],
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
  '_, it: interoperates with pipeline operator part 2',
  [macros.babel7],
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
  '_, it: assignment expressions are applied similarly to declarations',
  [macros.babel7, macros.babel6],
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