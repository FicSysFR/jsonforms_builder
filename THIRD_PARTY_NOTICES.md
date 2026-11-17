# Third-Party Notices

`@ficsysfr/jsonforms_builder` is licensed under the BSD-3-Clause License (see `LICENSE`). This file
ships with the npm package and reproduces the notices of the third-party code it contains.

Every other runtime dependency (Vue, JSON Forms, Nuxt UI, Tiptap, `@internationalized/date`,
`defu`, `radash`) stays external: it is installed by the host application and keeps its own
license file in `node_modules`.

## JSON Forms (MIT License, derived source)

This project includes source code derived from the JSON Forms project, which is licensed under the
MIT License by EclipseSource Munich (2017-2019). The derived code is part of `src/` and of the
compiled `dist/` files.

```
The MIT License

Copyright (c) 2017-2019 EclipseSource Munich
https://github.com/eclipsesource/jsonforms

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

## Day.js (`dayjs`, MIT License, bundled)

The compiled `dist/` files bundle Day.js and its `customParseFormat` plugin
(<https://github.com/iamkun/dayjs>), so that hosts do not have to pre-bundle a CommonJS
dependency.

```
MIT License

Copyright (c) 2018-present, iamkun

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Repository only: playground example corpus

The playground example corpus (not part of the npm package) is derived from two EclipseSource
repositories, both under the JSON Forms MIT License reproduced above:

- [`eclipsesource/jsonforms`](https://github.com/eclipsesource/jsonforms) — `packages/examples`
- [`eclipsesource/jsonforms-vuetify-renderers`](https://github.com/eclipsesource/jsonforms-vuetify-renderers) — `example/src/examples` (files prefixed `vuetify-`)
