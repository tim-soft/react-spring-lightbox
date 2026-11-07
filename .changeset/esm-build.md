---
'react-spring-lightbox': minor
---

Ship an ES module build next to the CommonJS one. An `exports` map sends `import` to `dist/index.mjs` and `require` to `dist/index.cjs`, each with its own types, so bundlers can drop the lightbox from apps that import it without using it. TypeScript projects that compile to CommonJS now get types that match `require('react-spring-lightbox')`.

Two changes can break existing setups. Imports of files inside `dist/`, such as `react-spring-lightbox/dist/index.cjs.js`, no longer resolve, so import the package by name instead. The package now needs Node.js 22.18 or later in the 22 line, 24.11 or later in the 24 line, or Node.js 26 and later, along with npm 10.9 or later.
