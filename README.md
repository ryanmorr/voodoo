# voodoo

[![Version Badge][version-image]][project-url]
[![Build Status][build-image]][build-url]
[![License][license-image]][license-url]

> An experimental reactive execution context inspired by Svelte

If you're familiar with Svelte 3, you're probably an admirer of its reactivity. Just change a variable and the DOM is automatically updated. It's so elegantly simple, don't you wish you could do it in vanilla JavaScript? Well, as it turns out, you can. By supplying a proxied object to a with statement, you can alter the properties as if they were variables and use the proxy's traps to be notified of changes. This project is a proof of concept (not recommended for production) to demonstrate this functionality with a layer of abstraction to avoid some obstacles and ease of use.

## Install

Download the [CJS](https://github.com/ryanmorr/voodoo/raw/master/dist/voodoo.cjs.js), [ESM](https://github.com/ryanmorr/voodoo/raw/master/dist/voodoo.esm.js), [UMD](https://github.com/ryanmorr/voodoo/raw/master/dist/voodoo.umd.js) versions or install via NPM:

```sh
npm install @ryanmorr/voodoo
```

## Usage

Provide code (as a function or a string) in which you manipulate state variables. A function is returned that is used to execute the code in an isolated context, passing the initial state and observable functions that are called when a state variable is accessed, reassigned, or even deleted (it will actually just set the property value to undefined). The executor function returns the proxied state object that will remain in sync with the state variables:

```javascript
import voodoo from '@ryanmorr/voodoo';

const exec = voodoo((foo, bar, baz) => {
    foo = foo + 10;
    setTimeout(() => (bar = 20), 1000);
    delete baz;
    const qux = baz;
});

const state = exec({foo: 1, bar: 2, baz: 3}, {
    get(name, value) {
        console.log(`get "${name}" with value of ${value}`);
    },
    set(name, nextValue, prevValue) {
        console.log(`set "${name}" value to ${nextValue} from ${prevValue}`);
    },
    delete(name, prevValue) {
        console.log(`delete "${name}" with value of ${prevValue}`);
    }
});

state.bar = 5;
```

Writes the following to the console:

```
get "foo" with value of 1
set "foo" value to 11 from 1
delete "baz" with value of 3
get "baz" with value of undefined
set "bar" value to 5 from 2
set "bar" value to 20 from 5
 ```

## License

This project is dedicated to the public domain as described by the [Unlicense](http://unlicense.org/).

[project-url]: https://github.com/ryanmorr/voodoo
[version-image]: https://badge.fury.io/gh/ryanmorr%2Fvoodoo.svg
[build-url]: https://travis-ci.org/ryanmorr/voodoo
[build-image]: https://travis-ci.org/ryanmorr/voodoo.svg
[license-image]: https://img.shields.io/badge/license-Unlicense-blue.svg
[license-url]: UNLICENSE