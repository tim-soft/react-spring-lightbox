---
'react-spring-lightbox': patch
---

Build with Rolldown and TypeScript 7 instead of Rollup, Babel, and TypeScript 5, and drop the `@babel/runtime` dependency.

- `dependencies` no longer lists `@babel/runtime`. The 1.9.0 bundle required `@babel/runtime/helpers/defineProperty`, `@babel/runtime/helpers/extends`, and `@babel/runtime/helpers/objectWithoutProperties`, and neither bundle needs them now.
- Both bundles target ES2022. Class fields, object spread and rest, and optional chaining stay native, where Babel used to turn class fields and object spread into helper calls. Safari 15.6, Chrome 109, Firefox 102, and later run this syntax, the same browsers the Babel build targeted. A parser that cannot read class fields, such as the one in webpack 4, could not read 1.9.0 either, because 1.9.0 already used optional chaining.
- The CommonJS bundle went from 12.2 kB to 10.2 kB, or from 4.0 kB to 3.7 kB gzipped. The new ES module bundle is 9.4 kB, or 3.5 kB gzipped.
- Rolldown's Oxc minifier replaces Terser, so minified names and stack traces differ from 1.9.0. Both bundles ship source maps.
- TypeScript 7 writes the declarations, and `rolldown-plugin-dts` bundles them into one file per module format.
- No runtime behavior change is intended. The unit tests run the same user flows against both built bundles, and CI runs the Playwright suite in Chromium, Firefox, and WebKit.
- Linting, formatting, and the git hooks also moved, to oxlint, oxfmt, and husky 9, but none of that ships in the package.
