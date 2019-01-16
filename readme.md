# param.macro &middot; [![Version](https://img.shields.io/npm/v/param.macro.svg?style=flat-square&maxAge=3600)](https://www.npmjs.com/package/param.macro) [![License](https://img.shields.io/npm/l/param.macro.svg?style=flat-square&maxAge=3600)](https://www.npmjs.com/package/param.macro) [![Travis CI](https://img.shields.io/travis/citycide/param.macro.svg?style=flat-square&maxAge=3600)](https://travis-ci.org/citycide/param.macro) [![JavaScript Standard Style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square&maxAge=3600)](https://standardjs.com)

> Partial application syntax and lambda parameters for JavaScript, inspired by Scala's `_` & Kotlin's `it`. Read more about this macro in the intro blog post ["Partial Application & Lambda Parameter Syntax for JavaScript"](https://medium.com/@citycide/partial-application-lambda-parameters-for-js-aa16f4d94df4)

> **try it live** on the **[online playground](https://citycide.github.io/param.macro)**

* [overview](#overview)
* [installation](#installation)
  * [set custom tokens](#set-custom-tokens)
* [examples & features](#examples)
  * [lambda parameters](#lambda-parameters): `utensilList.find(it.isFork())`
  * [argument placeholders](#argument-placeholders): `add(1, _)`
  * [in assignments](#_-and-it-in-assignments): `const areSameThing = _ === _`
  * [other expressions](#other-expressions): `it.getPower().level > 9000`, ``const greet = `Hello, ${_}!` ``
  * [`lift` modifier](#lift-modifier): `;[1, 2].reduce(lift(_ = _))`
* [usage](#usage)
  * [Babel v7](#babelrcjs-babel-v7)
  * [Babel v6](#babelrc-babel-v6)
  * [standalone plugin](#standalone-plugin)
* [differences between `_` and `it`](#differences-between-_-and-it)
* [caveats & limitations](#caveats--limitations)
* [comparison to libraries](#comparison-to-libraries)
* [see also](#see-also)
* [development](#development)
* [contributing](#contributing)
* [license](#license)

---

## overview

_param.macro_ provides two main symbols &mdash; `it` and `_`.

`it` can be used in an expression passed to a function which implicitly creates
a lambda function in place accepting a single argument.

The `_` symbol is inspired by Scala and is used as a placeholder to signal that
a function call is partially applied &mdash; the original code isn't actually called
yet, but will return a new function receiving the arguments you signified as
placeholders. Think of the values that aren't placeholders as being "bound", and
you'll provide the rest later.

Check out the [examples](#examples) section and the [official introduction post][blog]
if you'd like to see how these can be useful.

## installation

```console
npm i --save-dev param.macro
```

Make sure you also have [Babel][babel] and [babel-plugin-macros][babel-plugin-macros]
installed (the following use Babel v7, see [_usage_](#usage) for more):

```console
npm i --save-dev @babel/cli @babel/core babel-plugin-macros
```

... and configured with Babel:

```js
module.exports = {
  presets: [],
  plugins: ['babel-plugin-macros']
}
```

> for usage without `babel-plugin-macros`, see [_standalone plugin_](#standalone-plugin)

Then just `import` and use:

```js
import { _, it } from 'param.macro'
```

`it` is also the default export, so you could also do:

```js
import it from 'param.macro'
```

> The benefits of this explicit import are that linters and type systems won't have
a fit over `_` and `it` not being defined. It's also self-documenting and more easily
understandable. Anyone looking at your code will know that these symbols come from
`param.macro`.

### set custom tokens

You can set custom identifiers for these just by using an aliased import.

```js
import { it as IT, _ as PLACEHOLDER } from 'param.macro'
```

or for the default `it` export:

```js
import IT from 'param.macro'
```

## examples

### lambda parameters

Scala, Kotlin, etc have what's called a _lambda parameter_ &mdash; an easy shorthand
for passing unary (single-argument) functions to other functions (higher order).
It's useful in higher order functions like `Array#map()`:

```js
import it from 'param.macro'

const people = [
  { name: 'Jeff' },
  { name: 'Karen' },
  { name: 'Genevieve' }
]

people.map(it.name)
// -> ['Jeff', 'Karen', 'Genevieve']
```

### argument placeholders

Transform this:

```js
import { _ } from 'param.macro'

function sumOfThreeNumbers (x, y, z) {
  return x + y + z
}

const oneAndTwoPlusOther = sumOfThreeNumbers(1, 2, _)
```

... into this:

```js
function sumOfThreeNumbers (x, y, z) {
  return x + y + z
}

const oneAndTwoPlusOther = _arg => {
  return sumOfThreeNumbers(1, 2, _arg)
}
```

### `_` and `it` in assignments

Most expressions using `_` and `it` can also be used outside function calls and
assigned to a variable. Here are some ultra simple cases to demonstrate this:

```js
import { _, it } from 'param.macro'

const identity = it
const isEqualToItself = it === it

const areSameThing = _ === _
```

... becomes:

```js
const identity = _it => _it
const isEqualToItself = _it2 => _it2 === _it2

const areSameThing = (_arg, _arg2) => _arg === _arg2
```

We could implement a `hasOwn()` function to check if a property exists on an
object like this:

```js
import { _ } from 'param.macro'

const hasOwn = it.hasOwnProperty(_)
const object = { flammable: true }

hasOwn(object, 'flammable')
// -> true
```

### other expressions

You can also put these macros to use within binary expressions, template literals,
and most other expressions.

```js
import { it, _ } from 'param.macro'

const log = console.log(_)

log([0, 1, 0, 1].filter(!!it))
// -> [1, 1]

const heroes = [
  { name: 'bob', getPower () { return { level: 9001 } } },
  { name: 'joe', getPower () { return { level: 4500 } } }
]

log(heroes.find(it.getPower().level > 9000))
// -> { name: 'bob', getPower: [Function] }

const greet = `Hello, ${_}!`

log(greet('world'))
// -> Hello, world!
```

It's especially fun to use with the pipeline operator since it basically removes
the need to auto-curry an entire library's API (like [Ramda][ramda]), which can be
pretty costly for performance.

This is a scenario specifically tested against to ensure compatibility:

```js
import { _, it } from 'param.macro'

const add = _ + _
const tenPlusString =
  it
  |> parseInt(_, 10)
  |> add(10, _)
  |> String

tenPlusString('10') |> console.log
// -> 20
```

### `lift` modifier

In addition to `_` and `it`, there is a third symbol exported by `param.macro`
called **`lift`**. In most scenarios it is simply removed from the output but is
very useful in combination with `_` placeholders.

Because `it` creates only _unary_ functions in place and `_` always traverses
_out_ of its nearest parent function call, `lift` serves as an operator that
fills out the middle ground: using placeholders to create inline functions of
any arity.

With `_` alone, the following example will not do what you probably want:

```js
import { _ } from 'param.macro'

const array = [1, 2, 3, 4, 5]
const sum = array.reduce(_ + _)
```

Because it produces this:

```js
const array = [1, 2, 3, 4, 5]
const sum = (_arg, _arg2) => {
  return array.reduce(_arg + _arg2)
}
```

To actually pass in an implicit binary function with `_` you can use the `lift`
operator:

```js
import { _, lift } from 'param.macro'

const array = [1, 2, 3, 4, 5]
const sum = array.reduce(lift(_ + _))
console.log(sum)
// -> 15
```

It may be helpful to note that `_` is still following its own rules here: it
traversed upward out of its parent function call! It just so happens that call
is removed afterward leaving your new function exactly where you want it.

## usage

### .babelrc.js (Babel v7)

```js
module.exports = {
  presets: [],
  plugins: ['babel-plugin-macros']
}
```

### .babelrc (Babel v6)

```json
{
  "presets": [],
  "plugins": ["babel-plugin-macros"]
}
```

### standalone plugin

A standalone version is also provided for those not already using `babel-plugin-macros`:

* .babelrc.js (Babel v7)

  ```js
  module.exports = {
    presets: [],
    plugins: ['module:param.macro/plugin']
  }
  ```

* .babelrc (Babel v6)

  ```json
  {
    "presets": [],
    "plugins": ["param.macro/plugin"]
  }
  ```

## differences between `_` and `it`

There are two main & distinct constructs provided by _param.macro_:

* `_` &rarr; partial application symbol
* `it` &rarr; implicit parameter symbol

There are a couple of major differences between the two:

### scoping

`_` will always traverse upward out of the nearest function call, while `it` will be
transformed in place. It's easiest to see when we look at a simple example:

```js
import { _, it } from 'param.macro'

const array = [1, 2, 3]
array.map(_)
array.map(it)
```

While these look like they might be the same, they'll come out acting very different:

```js
const array = [1, 2, 3]
_arg => array.map(_arg)
array.map(_it => _it)
```

An exception to these scoping differences is at the top-level, like the right-hand
side of an assignment. `it` and `_` behave similarly here since there's no further
upward to go, so they'll both happen to target the same place.

For example the following two map implementations do the same thing:

```js
import { _, it } from 'param.macro'

const map1 = _.map(_)
const map2 = it.map(_)
```

_However_, if nested deeper inside a function call the object placeholder `_` in
`map1` above would traverse further upward than an `it` would, and create a separate
function _first_, before the argument placeholder `_` inside the method call itself.
This creates an unary method call instead of the implicit binary function we probably
wanted, `lift` or not.

The `it` implementation in `map2` above _does_ still create the implicit binary
function, even if nested deeper. And following the normal placeholder rules, any `_`
inside the method call will traverse up to the method call and stop to create a
function there, as we wanted.

### argument reuse

`it` always refers to the same argument even when used multiple times in an
argument list. `_` will always refer to the _next_ argument.

```js
import { _, it } from 'param.macro'

console.log(_ + _ + _)
console.log(it + it + it)
```

... are compiled to:

```js
(_arg, _arg2, _arg3) => console.log(_arg + _arg2 + _arg3)
console.log(_it => _it + _it + _it)
```

## caveats & limitations

> `_` is a common variable name ( eg. for [lodash][lodash] )

This is the most obvious potential pitfall when using this plugin. `_` is
commonly used as the identifier for things like lodash's collection of utilities.

There are a few reasons this is totally fine.

1. The plugin allows for [custom symbols](#set-custom-tokens)

    If you do happen to need `_` or `it` as identifiers, you're able to change
    the imported symbols (using standard aliased imports) to anything you want.

2. `_` is a common symbol for partial application

    The Scala language uses the underscore as a placeholder for partially applied
    functions, and tons of JavaScript libraries have also used it &mdash; so it's become
    recognizable.

3. Monolithic builds of packages like lodash are on the way out

    lodash v5 will be getting rid of the monolithic build in favor of explicitly
    imported or 'cherry-picked' utilities. So it will become less common to see
    the entirety of lodash imported, especially with ES module tree-shaking on
    the horizon.

    On top of that, [babel-plugin-lodash][babel-lodash] still works effectively
    when you just import what you need like this:

    ```js
    import { add } from 'lodash'
    ```

4. Partial application with `_` is damn cool

## comparison to libraries

Lodash, Underscore, Ramda, and other libraries have provided partial application
with a helper function something like `_.partial(fn, _)` which wraps the provided
function, and basically just takes advantage of the fact that `{} !== {}` to recognize
that the monolithic `_`, `_.partial.placeholder`, or Ramda's `R.__` is a specific
object deemed a placeholder.

This Babel plugin gives you the same features at the syntax level. And on top of
that, it adds features no runtime library can manage (like arbitrary expressions)
and comes with zero runtime overhead. The macros are compiled away and turn into
regular functions that don't have to check their arguments to see if a placeholder
was provided.

## see also

* [TC39 proposal][proposal] &ndash; official syntactic proposal to the TC39 JavaScript standard
* [babel-plugin-partial-application][bppa] &ndash; precursor to this project, more features but less stable
* [lodash/fp][lodash-fp] &ndash; functional adaptation of the great Lodash utility library
* [Ramda][ramda] &ndash; highly functional programming-oriented utility library
* [babel-plugin-transform-scala-lambda][scala-lambda] &ndash; a similar plugin for more limited Scala-like lambda syntax

## development

1. Clone the repo: `git clone https://github.com/citycide/param.macro.git`
2. Move into the new directory: `cd param.macro`
3. Install dependencies: `npm install`
4. Build the source: `npm run build`
5. Run tests: `npm test`

> this project uses itself in its source &mdash; see the [`npm-self-link`][self-link]
readme for more about 'bootstrapping' and how it handles that build step for us

## contributing

Pull requests and any [issues](https://github.com/citycide/param.macro/issues)
found are always welcome.

1. Fork the project, and preferably create a branch named something like `feat-make-better`
2. Follow the build steps [above](#development) but using your forked repo
3. Modify the source files in the `src` directory as needed
4. Make sure all tests continue to pass, and it never hurts to have more tests
5. Push & pull request! :tada:

## license

MIT © [Bo Lingen / citycide](https://github.com/citycide)

[blog]: https://medium.com/@citycide/partial-application-lambda-parameters-for-js-aa16f4d94df4
[babel]: https://babeljs.io
[babel-cli]: http://babeljs.io/docs/usage/cli/
[babel-plugin-macros]: https://github.com/kentcdodds/babel-plugin-macros
[babel-lodash]: https://github.com/lodash/babel-plugin-lodash
[proposal]: https://github.com/rbuckton/proposal-partial-application
[lodash]: https://github.com/lodash/lodash
[lodash-fp]: https://github.com/lodash/lodash/wiki/FP-Guide
[ramda]: http://ramdajs.com/
[scala-lambda]: https://github.com/xtuc/babel-plugin-transform-scala-lambda
[bppa]: https://github.com/citycide/babel-plugin-partial-application
[self-link]: https://github.com/Andarist/npm-self-link
