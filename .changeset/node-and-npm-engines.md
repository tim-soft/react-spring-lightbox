---
'react-spring-lightbox': minor
---

Require Node.js `^22.18.0 || ^24.11.0 || >=26.0.0` and npm `>=10.9.0` in `engines`, up from Node.js `>=16` and npm `>=7`.

- Node.js 16, 18, and 20 are past end of life. Installing the package from a git URL runs its `prepare` script, which builds it with `rolldown-plugin-dts`, and that plugin supports only these Node.js versions.
- The published bundles use no Node.js APIs and need only ES2022 support, so the new minimum comes from the build and from Node.js's support schedule rather than from the code the lightbox runs.
- On older versions, npm prints `npm warn EBADENGINE Unsupported engine` and installs anyway. With `engine-strict=true`, npm stops with `npm error code EBADENGINE`. Yarn 1 always stops, with `The engine "node" is incompatible with this module` followed by `error Found incompatible module`. Upgrade Node.js, or skip the check with `yarn install --ignore-engines` or `npm install --engine-strict=false`.
