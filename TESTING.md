# Testing

This file describes how react-spring-lightbox is tested, for people and coding agents. On every pull request to master, CI runs the `changeset`, `lint`, `test`, and `e2e` jobs in `.github/workflows/test.yml`.

## Checks at a glance

| Check                           | Command                                        | CI job      |
| ------------------------------- | ---------------------------------------------- | ----------- |
| Unit tests and coverage         | `npm test`                                     | `test`      |
| Browser tests                   | `npm run test:e2e`                             | `e2e`       |
| Types                           | `npm run lint:ts`                              | `lint`      |
| Lint and format                 | `npm run lint:oxlint` and `npm run lint:oxfmt` | `lint`      |
| Exports and published types     | `npm run lint:package`                         | `lint`      |
| A changeset in the pull request | `npx changeset status --since=origin/master`   | `changeset` |
| Demo app build                  | `npm run build` in `example/`                  | none        |

## Unit tests

`npm test` runs Vitest once with coverage, and `npm run test:watch` reruns tests as files change. To run one file, pass its path, such as `npx vitest run src/__tests__/paging.test.tsx`. To run only the tests whose names match, add `-t` and part of a name, such as `-t 'a quick flick pages'`.

The tests live in `src/__tests__/`. Most files cover one feature that a user sees, such as `paging.test.tsx` and `zooming.test.tsx`. `scripts/add-release-dates.test.mjs` tests the release-date script.

### Simulated browser

The tests run in jsdom with Vitest's fake timers, and `src/__tests__/setup.ts` drives react-spring's frame loop from those timers. `src/__tests__/helpers.tsx` has the tools that most tests use:

- `lightboxProps()` returns props for an open lightbox over five images, with a spy for each callback.
- `advance(ms)` moves time forward, and `settle()` waits until every spring rests.
- `mockLayout()` gives the stage and the images a size, because jsdom has no layout.
- `shownImage()` and `imageTransform()` read what a user would see.

`src/__tests__/devices.ts` sends input the way a browser does, with the same events in the same order. Its exports include `mouse`, `wheel`, `trackpad`, `touch`, `touchscreen`, `safariPinch`, and `pressKey`.

Test what a user can see, such as the image in view, an image's transform, or a callback, rather than component state.

### Limits of jsdom

jsdom has no layout and no real input. With fake timers, the tests also run an animation frame before the next touch event, while a browser runs input handlers first. A race between input and animation frames can therefore pass in jsdom and fail in a browser, or the reverse. Confirm any bug that depends on gesture timing in the browser tests before you report or fix it.

### Published bundles

`src/__tests__/published-bundle.test.tsx` runs a few user flows against `dist/index.cjs` and `dist/index.mjs`, the files that people install. Run `npm run build` first. Without `dist/`, these tests fail with ``dist/index.cjs is missing. Run `npm run build` first.`` With an old `dist/`, they test the old code.

### Type tests

`src/__tests__/public-types.test.ts` checks the public types with `expectTypeOf`. `npm run lint:ts` checks these assertions. Vitest runs the file too, but at runtime its tests do nothing.

### Known bugs

Each known bug that isn't fixed yet has a `test.fails` test. The test's name describes the correct behavior and ends with the issue number, as in `test.fails('one trackpad swipe pages one image (#52)', ...)`. Vitest reports these tests as expected failures.

- When a fix makes one of these tests pass, Vitest fails the run. Change `test.fails` to `test` in the same pull request.
- To record a bug that you aren't fixing, add a `test.fails` test the same way.

### Coverage

`npm test` fails when coverage of `src/` drops below 100% of lines, functions, or statements, or when more than two branches go uncovered. The two uncovered branches are the `else if (goToIndex < 0)` checks in `ImagePager`, which can never be false. The report is in `coverage/unit/index.html`.

## Browser tests

`npm run test:e2e` runs Playwright. Install its browsers once with `npx playwright install chromium firefox webkit`.

Playwright starts Vite on port 5174 with `e2e/vite.config.mts`. Vite serves `e2e/harness/`, a page that renders the lightbox from `src/`, so these tests don't need a build. Each test opens the page with query flags that pick a setup, such as `/?index=2&singleClickToZoom`, and `e2e/harness/main.tsx` reads them.

Outside CI, Playwright reuses any server that already listens on port 5174, even one started from another checkout. Stop other servers on that port before you run the tests.

- The five projects are `chromium`, `firefox`, `webkit`, `mobile-chromium` (a Pixel 7), and `mobile-webkit` (an iPhone 15).
- To run one project, pass `--project`, such as `npx playwright test --project=chromium`. To run one file, pass its path, such as `npx playwright test e2e/zooming.spec.ts`.
- Some tests send real mouse, wheel, or multi-finger touch input through Chromium's DevTools protocol, with `chromiumInput()` from `e2e/support.ts`. Those tests run only in `chromium` or `mobile-chromium`.
- After a gesture, call `settle(page)` from `e2e/support.ts`. It waits until the images, the pages, and the container stop changing transform and opacity.
- With `E2E_COVERAGE=true`, Chromium records which lines of `src/` run, and the run writes `coverage/e2e/lcov.info`.
- Failed tests leave their output in `test-results/`. CI uploads the HTML report as the `playwright-report` artifact.

### WebKit failures on a local machine

WebKit can fail on a local machine where CI passes. In November 2026, 36 `webkit` and `mobile-webkit` tests failed on one macOS machine on an unmodified master, most of them by timing out while opening the lightbox. Before you blame a change for a WebKit failure, run the same projects on master and compare the failing test titles. CI on Ubuntu decides whether WebKit passes.

## Lint, types, and the package

- `npm run lint:ts` runs `tsc --noEmit` on the root project and on `e2e/`. Vitest doesn't type-check, so this is the only type check of the tests.
- `npm run lint:package` runs publint, then Are the Types Wrong. `attw --pack .` packs the package, which runs `prepare` and builds it. Then it checks that each `exports` condition resolves to a file and to types that match it.
- `npm run lint` runs oxlint, `oxfmt --check`, and both checks above.
- CI doesn't build the demo app. After you change props, exports, or the build output, run `npm install` and `npm run build` in `example/`. Next.js type-checks the app while it builds.

## Test a change against React 18

The repository develops on React 19, and the peer range starts at React 16.8. To run the suites against React 18.3.1, commit your change, then run them in a copy that installs React 18:

```bash
DIR=$(mktemp -d)
git archive HEAD | tar -x -C "$DIR"
cd "$DIR"
npm pkg set devDependencies.react=18.3.1 devDependencies.react-dom=18.3.1 'devDependencies.@types/react=^18.3.0' 'devDependencies.@types/react-dom=^18.3.0'
rm package-lock.json
npm install
npx vitest run
npx playwright test --project=chromium
```

`npm install` builds `dist/` in the copy, so the published-bundle tests run against React 18 too. Husky prints `.git can't be found` there, which is expected, because the copy isn't a git checkout. Stop other servers on port 5174 first, or Playwright tests another checkout's React.

## Preview the release notes

The Version Packages pull request runs `npm run ch:version`, which writes `CHANGELOG.md` from the changesets without formatting it. After that pull request merges, the `lint` job checks `CHANGELOG.md` with `oxfmt --check`. To read the release notes that your changesets produce and check their format, generate them in a scratch copy:

```bash
DIR=$(mktemp -d)
git archive HEAD | tar -x -C "$DIR"
cp .changeset/*.md "$DIR/.changeset/"
ln -s "$PWD/node_modules" "$DIR/node_modules"
cd "$DIR"
npm run ch:version
npx oxfmt --check CHANGELOG.md
```

The new release is the first section of `CHANGELOG.md` in the copy. The `cp` line brings in changesets that you haven't committed yet. In a real release, each entry also starts with its commit hash.
