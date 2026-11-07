---
'react-spring-lightbox': minor
---

Ship an ES module build next to the CommonJS one. An `exports` map sends `import` to `dist/index.mjs` and `require` to `dist/index.cjs`, each with its own types, so bundlers can drop the lightbox from apps that import it without using it. TypeScript projects that compile to CommonJS now get types that match `require('react-spring-lightbox')`. The package now needs Node.js 22.12 or later and npm 10.9 or later.
