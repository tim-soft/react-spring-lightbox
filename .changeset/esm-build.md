---
'react-spring-lightbox': minor
---

Add an ES module build and an `exports` map, so `import` and `require` each load their own bundle with matching types.

- The package now ships `dist/index.mjs` (ES module) and `dist/index.cjs` (CommonJS, renamed from `dist/index.cjs.js`), each with a source map. The type declarations are bundled into `dist/index.d.mts` for `import` and `dist/index.d.cts` for `require`. They replace `dist/index.d.ts` and the per-file declarations that 1.9.0 shipped under `dist/components/` and `dist/types/`.
- `package.json` now sets `"main": "./dist/index.cjs"`, `"module": "./dist/index.mjs"`, and `"types": "./dist/index.d.cts"`. Its new `exports` map has `import` and `require` conditions for the package root and also exposes `./package.json`.
- Bundlers now load the ES module build. Together with the existing `"sideEffects": false`, that lets them drop the lightbox entirely from an app that imports it without rendering it.
- `import Lightbox, { ImagesListType } from 'react-spring-lightbox'` works as before, and `require('react-spring-lightbox')` still returns the component itself, not `{ default }`.
- The CommonJS declarations now use `export =`, which matches `module.exports = Lightbox`. The 1.9.0 declarations used `export default`, so TypeScript projects compiling to CommonJS under `"module": "node16"` or `"nodenext"` expected a `.default` property that does not exist at runtime. `import Lightbox = require('react-spring-lightbox')` now type-checks as well.
- The declarations import React's types from `react` instead of relying on the global `React` namespace that `@types/react` declares.
- Release 1.8.0 removed an earlier ES module build because of problems with Next.js and its SWC compiler. The repository's Next.js 16 demo, which uses Turbopack, builds and hot-reloads with this one.

Upgrade notes:

- Imports of files inside `dist/` now fail, because the `exports` map exposes only the package root and `./package.json`. Node.js reports `ERR_PACKAGE_PATH_NOT_EXPORTED`, and bundlers report that the package path is not exported. Import from `react-spring-lightbox` instead, and replace imports of `dist/types/ImagesList` with `import type { ImagesListType } from 'react-spring-lightbox'`.
- Configuration that names `dist/index.cjs.js` directly needs to name the package instead.
