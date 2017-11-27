# partial-application.macro &middot; [![Version](https://img.shields.io/npm/v/partial-application.macro.svg?style=flat-square&maxAge=3600)](https://www.npmjs.com/package/partial-application.macro) [![License](https://img.shields.io/npm/l/partial-application.macro.svg?style=flat-square&maxAge=3600)](https://www.npmjs.com/package/partial-application.macro) [![Travis CI](https://img.shields.io/travis/citycide/partial-application.macro.svg?style=flat-square&maxAge=3600)](https://travis-ci.org/citycide/partial-application.macro) [![JavaScript Standard Style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square&maxAge=3600)](https://standardjs.com)

> Partial application syntax and implicit parameters for JavaScript, inspired by Scala's `_` & Kotlin's `it`.

> **try it live** on the **[online playground](https://citycide.github.io/partial-application.macro)**

- [overview](#overview)
- [installation](#installation)
  - [set custom tokens](#set-custom-tokens)
- [examples & features](#examples)
  - [lambda parameters](#lambda-parameters): `utensilList.find(it.isFork())`
  - [argument placeholders](#argument-placeholders): `add(1, _)`
  - [in assignments](#_-and-it-in-assignments): `const areSameThing = _ === _`
  - [other expressions](#other-expressions): `it.getPower().level > 9000`, ``const greet = `Hello, ${_}!` ``
- [usage](#usage)
  - [Babel v7](#babelrcjs-babel-v7)
  - [Babel v6](#babelrc-babel-v6)
  - [standalone plugin](#standalone-plugin)
- [differences between `_` and `it`](#differences-between-_-and-it)
- [caveats & limitations](#caveats--limitations)
- [comparison to libraries](#comparison-to-libraries)
- [see also](#see-also)
- [development](#development)
- [contributing](#contributing)
- [license](#license)

---

## overview

_partial-application.macro_ provides two symbols - `it` and `_`.

`it` can be used in an expression passed to a function which implicitly creates
a lambda function in place accepting a single argument.

The `_` symbol is inspired by Scala and is used as a placeholder to signal that
a function call is partially applied - the original code isn't actually called
yet, but will return a new function receiving the arguments you signified as
placeholders. Think of the values that aren't placeholders as being "bound", and
you'll provide the rest later.

Check out the [examples](#examples) section to see all the different ways
these are useful.

## installation

```console
npm i --save-dev partial-application.macro
```

Make sure you also have [Babel][babel] and [babel-macros][babel-macros]
installed (the following use Babel v7):

```console
npm i --save-dev @babel/cli @babel/core babel-macros
```

... and configured with Babel:

```js
module.exports = {
  presets: [],
  plugins: ['module:babel-macros']
}
```

> for usage without `babel-macros`, see [_standalone plugin_](#standalone-plugin)

Then just `import` and use:

```js
import { _, it } from 'partial-application.macro'
```

`it` is also the default export, so you could also do:

```js
import it from 'partial-application.macro'
```

> The benefits of this explicit import are that linters and type systems won't have
a fit over `_` and `it` not being defined. It's also self-documenting and more easily
understandable. Anyone looking at your code will know that these symbols come from
`partial-application.macro`.

### set custom tokens

You can set custom identifiers for these just by using an aliased import.

```js
import { it as IT, _ as PLACEHOLDER } from 'partial-application.macro'
```

or for the default `it` export:

```js
import IT from 'partial-application.macro'
```

## examples

### lambda parameters

Scala, Kotlin, etc have what's called a _lambda parameter_ - an easy
shorthand for passing unary (single-argument) functions to other functions
(higher order). It's useful in higher order functions like `Array#map()`:

```js
import it from 'partial-application.macro'

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
import { _ } from 'partial-application.macro'

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

Most expressions using `_` and `it` can also be used outside function
calls and assigned to a variable. Here are some ultra simple cases to
demonstrate this:

```js
import { _, it } from 'partial-application.macro'

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
import { _ } from 'partial-application.macro'

const hasOwn = _.hasOwnProperty(_)
const object = { flammable: true }

hasOwn(object, 'flammable')
// -> true
```

### other expressions

You can also put these macros to use within binary expressions, template literals,
and most other expressions.

```js
import { it, _ } from 'partial-application.macro'

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

## usage

### .babelrc.js (Babel v7)

```js
module.exports = {
  presets: [],
  plugins: ['module:babel-macros']
}
```

### .babelrc (Babel v6)

```json
{
  "presets": [],
  "plugins": ["babel-macros"]
}
```

### standalone plugin

A standalone version is also provided for those not already using
`babel-macros`:

* .babelrc.js (Babel v7)

  ```js
  module.exports = {
    presets: [],
    plugins: ['module:partial-application.macro/plugin']
  }
  ```

* .babelrc (Babel v6)

  ```json
  {
    "presets": [],
    "plugins": ["partial-application.macro/plugin"]
  }
  ```

## differences between `_` and `it`

There are two separate constructs provided by _partial-application.macro_:

* `_`: partial application symbol
* `it`: implicit parameter symbol

There are a couple of major difference between the two:

### scoping

`_` will always traverse upward out of the nearest function call, while `it` will be
transformed in place. It's easiest to see when we look at a simple example:

```js
import { _, it } from 'partial-application.macro'

array.map(_)
array.map(it)
```

While these look like they might be the same, they'll come out acting very different:

```js
_arg => return array.map(_arg)
array.map(_it => _it)
```

### argument reuse

`it` always refers to the same argument even when used multiple times in an
argument list. `_` will always refer to the _next_ argument.

```js
import { _, it } from 'partial-application.macro'

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

1. `_` is a common symbol for partial application

    The Scala language uses the underscore as a placeholder for partially
    applied functions, and tons of JavaScript libraries have also used it -
    so it's become recognizable.

2. Monolithic builds of packages like lodash are on the way out

    lodash v5 will be getting rid of the monolithic build in favor
    of explicitly imported or 'cherry-picked' utilities. So it will
    become less common to see the entirety of lodash imported,
    especially with ES module tree-shaking on the horizon.

    On top of that, [babel-plugin-lodash][babel-lodash] still works
    effectively when you just import what you need like this:

    ```js
    import { add } from 'lodash'
    ```

3. The plugin allows for [custom symbols][#set-custom-tokens]

    If you do happen to need `_` or `it` as identifiers, you're able to change
    the imported symbols (using standard aliased imports) to anything you want.

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

- [TC39 proposal][proposal] - official syntactic proposal to the TC39 JavaScript standard
- [babel-plugin-partial-application][bppa] - precursor to this project, more features but less stable
- [lodash/fp][lodash-fp] - functional adaptation of the great Lodash utility library
- [Ramda][ramda] - highly functional programming-oriented utility library
- [babel-plugin-transform-scala-lambda][scala-lambda] - a similar plugin for more limited Scala-like lambda syntax

## development

1. Clone the repo: `git clone https://github.com/citycide/partial-application.macro.git`
2. Move into the new directory: `cd partial-application.macro`
3. Install dependencies: `npm install`
4. Link the project to itself: `npm link && npm link partial-application.macro`
5. Build the source: `npm run build`
6. Run tests: `npm test`

> this project runs on itself, so take note of the `npm link` step
since it's necessary to build or test

## contributing

Pull requests and any [issues](https://github.com/citycide/partial-application.macro/issues)
found are always welcome.

1. Fork the project, and preferably create a branch named something like `feat-make-better`
2. Follow the build steps [above][#development] but using your forked repo
3. Modify the source files in the `src` directory as needed
4. Make sure all tests continue to pass, and it never hurts to have more tests
5. Push & pull request! :tada:

## license

MIT © [Bo Lingen / citycide](https://github.com/citycide)

[babel]: https://babeljs.io
[babel-cli]: http://babeljs.io/docs/usage/cli/
[babel-macros]: https://github.com/kentcdodds/babel-macros
[babel-lodash]: https://github.com/lodash/babel-plugin-lodash
[proposal]: https://github.com/rbuckton/proposal-partial-application
[lodash]: https://github.com/lodash/lodash
[lodash-fp]: https://github.com/lodash/lodash/wiki/FP-Guide
[ramda]: http://ramdajs.com/
[scala-lambda]: https://github.com/xtuc/babel-plugin-transform-scala-lambda
[bppa]: https://github.com/citycide/babel-plugin-partial-application
