---
'react-spring-lightbox': patch
---

Ship `CHANGELOG.md` in the npm package, so the release notes are in `node_modules/react-spring-lightbox/CHANGELOG.md` after an install.

- `files` in `package.json` now lists `CHANGELOG.md` and `MIGRATION.md` next to `dist`. Through 1.9.0, the package held only `dist/`, `package.json`, `README.md`, and `LICENSE`, so the release notes were only on GitHub.
- No release has a `MIGRATION.md` yet. The first release that needs a step-by-step migration guide ships one at `node_modules/react-spring-lightbox/MIGRATION.md`.
- Nothing imports either file, so app bundles don't change.
