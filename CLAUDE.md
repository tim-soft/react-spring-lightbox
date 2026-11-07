# react-spring-lightbox

This file tells coding agents how to work in this repository. `react-spring-lightbox` is a React image lightbox with touch gestures and react-spring animations, published to npm. Read [TESTING.md](TESTING.md) before you write or run tests.

## Repository layout

- `src/` is the library, and `src/index.tsx` is its entry. In `src/components/ImageStage/components/`, `ImagePager` pages between images and `Image` zooms and pans one image.
- `src/__tests__/` holds the Vitest unit tests. `e2e/` holds the Playwright tests and the page they drive.
- `example/` is a Next.js demo app that links the library from the parent folder. `example/README.md` explains how to run it.
- `scripts/` holds the oxlint plugin that sorts destructured keys and the script that dates new `CHANGELOG.md` entries.
- `rolldown.config.mjs` builds `dist/index.mjs` and `dist/index.cjs`, each with bundled types. The npm package holds only `dist/`, `package.json`, `README.md`, and `LICENSE`.

## Commands

Use npm, not Yarn. `package.json` requires Node.js `^22.18.0 || ^24.11.0 || >=26.0.0`, and CI runs Node.js 24.

| Command            | What it does                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| `npm install`      | Installs dependencies, then builds `dist/` through the `prepare` script                           |
| `npm run build`    | Builds `dist/`                                                                                    |
| `npm start`        | Rebuilds the JavaScript in `dist/` on every change, without types, for the demo app               |
| `npm run lint`     | Runs oxlint, `oxfmt --check`, `tsc` on the source and on `e2e/`, publint, and Are the Types Wrong |
| `npm run fix`      | Applies oxlint fixes, then formats every file with oxfmt                                          |
| `npm test`         | Runs the unit tests with coverage                                                                 |
| `npm run test:e2e` | Runs the Playwright tests in five browser projects                                                |

## Code rules

- The repository lints with oxlint and formats with oxfmt. Don't add ESLint, Prettier, or Babel. Rolldown and Oxc build the package without them.
- oxlint runs type-aware rules through `oxlint-tsgolint`, such as `typescript/no-floating-promises`. It also requires sorted object keys and sorted destructured keys. oxfmt sorts imports.
- TypeScript is 7.0, the native `tsc`, which has no JavaScript API. Tools that import `typescript` as a library don't work with it.
- `npm run build` prints ``The `tsgo` generator on TypeScript 7.0 is deprecated and will be removed in the next minor. Upgrade to TypeScript 7.1 or later.`` The build still works. Move to TypeScript 7.1 before you upgrade `rolldown-plugin-dts` past 0.30.
- Keep `@types/node` on the Node.js major that CI runs. Newer types describe APIs that CI's Node.js doesn't have.
- The unit tests require 100% line, function, and statement coverage of `src/`. Every change to `src/` needs tests.
- After you change `src/`, run `npm run build` before `npm test`. Some unit tests load `dist/`, and an old build gives them old code.
- The repository develops on React 19, and the peer range is `react >=16.8`. After you change rendering, state, or effects, test React 18 as TESTING.md describes.
- Never run `husky` with arguments. Husky 9 treats its first argument as the hooks directory and writes it to `core.hooksPath`, in git config that every worktree of the clone shares.
- Don't change the `version` field or add entries to `CHANGELOG.md` by hand. The Version Packages pull request writes both from the changesets.

## Changesets

Every pull request commits a changeset, a Markdown file in `.changeset/`. The `changeset` CI job runs `npx changeset status --since=origin/master`. When a pull request adds no changeset, the job fails with `Some packages have been changed but no changesets were found. Run changeset add to resolve this error.`

- If the pull request changes what people install, write a changeset with the bump level in its front matter. That covers `src/`, the build output, the published types, and `package.json` fields such as `dependencies`, `peerDependencies`, `engines`, and `exports`. `npm run ch` asks for the same details interactively.
- If the change doesn't need a release, such as a change to tests, CI, docs, or `example/`, run `npx changeset add --empty`.
- Write one changeset for each change a consumer would notice, so that each change gets its own entry.
- Choose patch, minor, or major by semver. If a change can break some consumers, as a stricter `exports` map or a higher `engines` minimum can, ask the maintainer which level to use.
- A changeset stays editable until a release uses it up. If your pull request changes something that a pending changeset describes, update that changeset so that the release notes stay true.

A changeset looks like this:

```md
---
'react-spring-lightbox': patch
---

One sentence that says what changed for someone who uses the package.

- A detail with exact versions and names, and any message quoted exactly.

Upgrade notes:

- How to tell that this note applies, and how to fix it.
```

### Write for someone debugging an upgrade

People and coding agents read `CHANGELOG.md` and the GitHub release notes when an upgrade breaks their app. Write each changeset so that a reader who has only an error message can find the entry, learn the cause, and fix it without reading this repository's code.

- Start with one sentence that says what changed for someone who uses the package.
- Name exact versions, version ranges, file paths, exports, props, and `package.json` fields, with the old value and the new one.
- Quote each warning or error that a consumer can see, exactly as the tool prints it, one line per quote. Readers search their logs for these strings, so capture the text by running the tool instead of writing it from memory.
- For a bug fix, describe the symptom a user saw, when it happened, and what the code did wrong.
- Say what you tested and what you didn't, such as React, Node.js, or bundler versions.
- Check each claim with a run before you write it.

### Add upgrade notes when consumers must act

End the changeset with an `Upgrade notes:` paragraph and a bulleted list when a consumer might have to change code, configuration, or dependencies. These changes need upgrade notes:

- A removed or renamed export, prop, file, or `package.json` path
- A changed default or behavior
- A higher minimum version of Node.js, npm, React, or a dependency
- A new warning during install or build

Each note says how to tell whether it applies, such as the error text or a command like `npm ls @react-spring/web`. Each note also gives the fix, with code before and after when code has to change.

### Write a migration guide for larger upgrades

If a release needs more steps than a few upgrade notes can hold, as a major version usually does, also write a guide in `MIGRATION.md`. Give each version its own section, newest first, with numbered steps and code before and after. Link to the section from the changeset with its full `https://github.com/tim-soft/react-spring-lightbox/blob/master/MIGRATION.md` URL, so that the link also works in the GitHub release notes.

### Preview the release notes before you push

`npm run ch:version` writes `CHANGELOG.md` without formatting it, and the `lint` job checks that file with `oxfmt --check` after the release merges. Generate the release notes in a scratch copy, read them, and check their format, as TESTING.md describes.
