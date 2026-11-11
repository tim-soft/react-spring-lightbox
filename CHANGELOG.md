# Changelog

## 1.10.0

_Released 2026-11-11_

### Summary

This release makes large galleries much faster and moves the lightbox to current dependencies. The entries below give the details. Read their upgrade notes for the `exports` map and the Node.js minimum before you upgrade.

**Performance.** Each number comes from the entry below that describes it, measured in Chromium with the CPU slowed down 4x, median of 6 runs, against 1.9.0 unless it says otherwise.

- Only the current image and its neighbors animate now. A 1.3-second drag over 1,000 images writes 351 CSS transforms instead of 117,000, and holding a drag over 100 images takes 163ms of main-thread time instead of 503ms.
- Images more than one page from the current one re-render only when their props change. Four arrow-key presses over 1,000 images render images 16 times instead of 4,000, and add 136 event listeners instead of 32,008.
- Hidden images move without starting a spring. On top of the change that animates only the shown images, that cuts the JavaScript for four arrow-key presses over 1,000 images from 780ms to 429ms.
- Opening the lightbox renders each image once instead of twice. Opening 1,000 images runs 472ms of JavaScript instead of 644ms, and the JavaScript heap with them open is 27MB instead of 37MB.

**Dependency upgrades.** Each one comes from its entry below.

- `@react-spring/web` goes from `^9.7.3` to `^10.1.2`, so the lightbox installs next to React 19 without peer dependency warnings. React 18 keeps working.
- `@use-gesture/react` `^10.3.1` replaces the deprecated `react-use-gesture` `9.1.3`, so installing the lightbox no longer prints a deprecation warning.
- `@babel/runtime` is gone. Rolldown and TypeScript 7 now build the package, and its bundles need no Babel helpers.
- The package adds an ES module build, `dist/index.mjs`, and an `exports` map. Bundlers load the ES module build, so they can drop the lightbox from an app that imports it without rendering it. `dist/index.cjs.js` is now `dist/index.cjs`, and imports of other files inside `dist/` fail.
- `engines` now requires Node.js `^22.18.0 || ^24.11.0 || >=26.0.0` and npm `>=10.9.0`, up from Node.js `>=16` and npm `>=7`.

### Minor Changes

- 3a4933c: Add an ES module build and an `exports` map, so `import` and `require` each load their own bundle with matching types.

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

- 4ecc7a7: The open lightbox is now a modal dialog that keyboard and screen reader users can work with, and it gives focus back when it closes.

    - The lightbox container has `role="dialog"`, `aria-modal="true"`, and `tabindex="-1"`. The new optional props `aria-label` and `aria-labelledby` name the dialog. Without either prop, screen readers announce a dialog with no name.
    - Opening the lightbox moves focus to the container, unless a control inside it already has focus, such as a button with `autoFocus` in `renderHeader`. With 1.9.0, focus stayed on the element that opened the lightbox, under the overlay. After a keyboard user opened an image with Enter and paged with the arrow keys, the next Enter pressed that hidden thumbnail again and jumped back to its image.
    - While the lightbox is open, each other child of `<body>` has the `inert` attribute, so Tab and screen readers can't reach the page behind it. With 1.9.0, Tab moved through the whole page behind the overlay before it reached the lightbox's own controls. Elements added to `<body>` after the lightbox opens, such as a menu that a header button portals to `<body>`, stay usable.
    - Tab from the last control in the lightbox moves focus to the first one, and Shift+Tab from the first moves focus to the last.
    - Closing the lightbox, or unmounting it while it's open, removes the `inert` attributes that it added and moves focus back to the element that had focus before it opened. With 1.9.0, pressing a close button inside the lightbox dropped focus to `<body>`, so the next Tab started from the top of the page.
    - An `inline` lightbox doesn't change.
    - Tested with the unit tests on React 19 and React 18.3.1, the Playwright tests in Chromium, Firefox, and mobile Chromium on React 19, and the Chromium Playwright tests on React 18.3.1. CI runs the WebKit projects. No screen reader was tested, but Chromium's accessibility tree listed only the lightbox's dialog and its controls while it was open.

    Upgrade notes:

    - If a screen reader announces your lightbox only as "dialog", the dialog has no name. Pass `aria-label`, or pass `aria-labelledby` with the `id` of a title in your header.

        Before:

        ```jsx
        <Lightbox
            isOpen={isOpen}
            /* your other props */
        />
        ```

        After:

        ```jsx
        <Lightbox
            aria-label="Product photos"
            isOpen={isOpen}
            /* your other props */
        />
        ```

    - If your page keeps a control usable over the open lightbox, such as a toolbar that sits above it with a higher `z-index`, that control is now inert while the lightbox is open. Clicks and Tab skip it. To check, open the lightbox and look for an `inert` attribute on the control or one of its ancestors in your browser's element inspector. To keep the control usable, render it in `renderHeader`, `renderFooter`, or `renderImageOverlay`.

        Before:

        ```jsx
        <>
            <Toolbar style={{ position: 'fixed', top: 0, zIndex: 500 }} />
            <Lightbox
                isOpen={isOpen}
                /* your other props */
            />
        </>
        ```

        After:

        ```jsx
        <Lightbox
            isOpen={isOpen}
            renderHeader={() => <Toolbar />}
            /* your other props */
        />
        ```

    - If your `onClose` handler moves focus to another element, focus now ends on the element that opened the lightbox instead. The lightbox moves focus back after `onClose` returns, so it overrides a `focus()` call inside the handler. Move focus in a `useEffect` that runs when `isOpen` changes to `false`, in the component that renders `<Lightbox>`. That effect runs after the lightbox moves focus back.

        Before:

        ```jsx
        const close = () => {
            setIsOpen(false);
            searchRef.current.focus();
        };
        ```

        After:

        ```jsx
        const focusSearchAfterClose = useRef(false);
        const close = () => {
            focusSearchAfterClose.current = true;
            setIsOpen(false);
        };

        useEffect(() => {
            if (!isOpen && focusSearchAfterClose.current) {
                focusSearchAfterClose.current = false;
                searchRef.current.focus();
            }
        }, [isOpen]);
        ```

    - In a browser that doesn't support the `inert` attribute, Tab and screen readers can still reach the page behind the open lightbox, as they could with 1.9.0. If your app supports such browsers, load an `inert` polyfill such as `wicg-inert`.

- 3a4933c: Require Node.js `^22.18.0 || ^24.11.0 || >=26.0.0` and npm `>=10.9.0` in `engines`, up from Node.js `>=16` and npm `>=7`.

    - Node.js 16, 18, and 20 are past end of life. Installing the package from a git URL runs its `prepare` script, which builds it with `rolldown-plugin-dts`, and that plugin supports only these Node.js versions.
    - The published bundles use no Node.js APIs and need only ES2022 support, so the new minimum comes from the build and from Node.js's support schedule rather than from the code the lightbox runs.
    - On older versions, npm prints `npm warn EBADENGINE Unsupported engine` and installs anyway. With `engine-strict=true`, npm stops with `npm error code EBADENGINE`. Yarn 1 always stops, with `The engine "node" is incompatible with this module` followed by `error Found incompatible module`. Upgrade Node.js, or skip the check with `yarn install --ignore-engines` or `npm install --engine-strict=false`.

- 3cd50c2: Support React 19 by moving to `@react-spring/web` 10, and fix two-finger pinch zoom stopping after its first step under React 19.

    - `dependencies` now has `@react-spring/web` `^10.1.2`, up from `^9.7.3`. Version 9 declares `react` and `react-dom` peers of `^16.8.0 || ^17.0.0 || ^18.0.0`, and version 10 adds `^19.0.0`. The lightbox's own peers stay `react >=16.8` and `react-dom >=16.8`.
    - With 1.9.0 next to React 19, npm 11 prints `npm warn ERESOLVE overriding peer dependency` and installs `@react-spring/web` 9.7.5 anyway. With `--strict-peer-deps`, npm stops with `npm error code ERESOLVE` and lists `@react-spring/web@"^9.7.3" from react-spring-lightbox@1.9.0` under `Could not resolve dependency:`. This release installs next to React 19 without either message.
    - Under React 19, a two-finger pinch zoomed for one step and then stopped. When the second finger landed, `ImagePager` marked itself as dragging and cancelled the drag. Its drag-end handler cleared that flag only inside an `if (isDragging)` check, which read a stale `false` because React 19 had not yet re-rendered the pager with the new value. The flag stayed set, and the image ignores pinches while the pager is dragging. The drag-end handler now always moves the pages back to their resting positions and clears the flag 100 ms after the gesture ends.
    - React 18 keeps working. The unit tests and the Chromium Playwright tests pass against React 18.3.1 as well as React 19. The peer range still includes React 16.8 and 17, which this release was not tested against.

    Upgrade notes:

    - If your app also depends on `@react-spring/web` 9, npm installs a second copy for the lightbox, and `npm ls @react-spring/web` lists 9.x at the top level and 10.x under `react-spring-lightbox`. Your bundle then carries both copies. Settings you apply through `Globals.assign`, such as `skipAnimation` in a test setup file, reach only your copy, so the lightbox's springs keep animating. Move your app to `@react-spring/web` 10 so both share one copy.

### Patch Changes

- 1ae0e83: Dragging, swiping, scrolling and paging through a large gallery takes less CPU time, because the lightbox now animates only the current image and its neighbors.

    - With 1.9.0, each page change and each move of a drag, swipe or wheel gesture started a spring for every image in `images`, including the hidden images more than one page away. Each of those springs then wrote a CSS transform on every animation frame. In Chromium, a 1.3-second drag over a 1000-image gallery wrote 117,000 transforms.
    - Hidden images now jump to their new place in one frame, and drags and wheel gestures leave them alone. The same drag writes 351 transforms.
    - In Chromium with the CPU slowed down 4x, median of 6 runs: holding a drag over 100 images took 503ms of main-thread time before and 163ms after. Over 1000 images, the same drag dropped 85 frames before and 4 after. Galleries of 5 images showed no measurable difference.
    - The current image and its neighbors move as before, except when a page change comes before the previous one finishes. Then a hidden image now starts from its resting place instead of from wherever its earlier animation had taken it. In Chromium, after jumps 150ms apart, the last image reached the stage 52ms later than with 1.9.0.
    - Tested together with the other performance changes in this release, with the unit tests on React 19 and React 18.3.1, the Playwright tests in all five browser projects on React 19, and the Chromium Playwright tests on React 18.3.1. The timings come from Chromium only. Timings on real phones, in Firefox and in Safari weren't measured.

- ed76418: Replace the deprecated `react-use-gesture` with its successor, `@use-gesture/react`, so installing the lightbox no longer prints a deprecation warning (#52).

    - `dependencies` now has `@use-gesture/react` `^10.3.1` in place of `react-use-gesture` `9.1.3`. Its `react` peer range, `>= 16.8.0`, matches the lightbox's.
    - With 1.9.0, npm 11 prints `npm warn deprecated react-use-gesture@9.1.3: This package is no longer maintained. Please use @use-gesture/react instead`. This release installs without it.
    - Version 10 reports several gesture values differently. Drag distance is the path traveled on each axis instead of the straight-line distance. Direction is a sign on each axis instead of a unit vector. Velocity is a speed on each axis, and it's 0 on the first move. A pinch reports a scale ratio instead of pixels. The lightbox converts each value back to what version 9 reported, so drags, flicks, scrolls, and pinches page and zoom at the same thresholds and speeds as in 1.9.0.
    - To check this, the same scripted gestures ran against 1.9.0 and this release: 70 in jsdom, compared frame by frame, and 46 in Chromium and its Pixel 7 emulation, with input timed through the DevTools protocol. Apart from the fixes in this release's other entries, each gesture paged and zoomed the same. One difference remains. A drag that creeps less than 3px before a fast flick pages one pointer move later, because version 10 doesn't report when the creeping moves happened.
    - Tested with React 19 and 18.3.1, and with Playwright in Chromium, Firefox, and WebKit. React 16.8 and 17 are still in the peer range, but weren't tested.

    Upgrade notes:

    - The lightbox no longer installs `react-use-gesture`. If your app imports it without listing it in its own `dependencies`, run `npm ls react-use-gesture` to see whether anything else still installs it, and add it to your `dependencies` or move to `@use-gesture/react`.
    - Tests that drag or pinch the lightbox in jsdom fail with `TypeError: event.target.setPointerCapture is not a function`, because jsdom has no pointer capture. Give `Element.prototype` no-op `setPointerCapture`, `releasePointerCapture`, and `hasPointerCapture` methods in your test setup.
    - In jsdom, also send what a browser sends. A pinch finds its fingers through each touch's `target`. The click after a drag is ignored only when its `detail` is above 0, as a mouse or touch click's is, and `fireEvent.click` sends `detail: 0` unless you pass one.
    - `@use-gesture/react` checks for touch events and Safari's `GestureEvent` once, when it loads. A test that emulates desktop Safari by removing `ontouchstart` or adding `GestureEvent` must do it before anything imports the lightbox, such as in `vi.hoisted()`.

- 455e260: The page behind the open lightbox no longer scrolls.

    - With 1.9.0, a swipe up or down on the lightbox's header or footer on a touchscreen scrolled the page behind it, because only the image stage set `touch-action: none`.
    - Now the modal lightbox sets `overflow: hidden` on `<html>` while it is open. Neither touch nor the keys that a text field or a menu portaled to `<body>` leaves to the browser scroll the page behind it. When the last open lightbox closes, it puts back the inline `overflow` and `padding-right` that `<html>` had when the first one opened, and the page is where it was.
    - If the page's scrollbar took up space, as classic scrollbars on Windows do, the lightbox adds that width to the `padding-right` of `<html>` while it is open, so the page's content doesn't shift when the scrollbar goes away. An element with `position: fixed` and `right: 0` still moves right by the scrollbar's width while the lightbox is open, 15px in a WebKit test. A scrollbar that overlays the page, as on macOS with a trackpad, takes up no space and adds no padding.
    - An `inline` carousel leaves the page alone.
    - Tested with the unit tests on React 19 and React 18.3.1, the Playwright tests in Chromium, Firefox, WebKit, and mobile Chromium on React 19, and the Chromium Playwright tests on React 18.3.1. The check that the page doesn't shift runs in WebKit only, because Playwright's Chromium hides scrollbars and Firefox ignores `::-webkit-scrollbar`. Not tested in Safari on iOS, or on a real touchscreen.

    Upgrade notes:

    - If your app sets `overflow` or `padding-right` on `<html>` while the lightbox is open, for example to stop the page from scrolling, you can remove that code. If you keep it, set it before `isOpen` turns true, and remove it after the lightbox closes. When the last open lightbox closes, it puts back the inline values that `<html>` had when the first one opened, so a value that your app sets while a lightbox is open doesn't stay.

        Before:

        ```jsx
        useEffect(() => {
            if (!isOpen) {
                return undefined;
            }
            document.documentElement.style.overflow = 'hidden';
            return () => {
                document.documentElement.style.overflow = '';
            };
        }, [isOpen]);

        return (
            <Lightbox
                isOpen={isOpen}
                /* your other props */
            />
        );
        ```

        After:

        ```jsx
        return (
            <Lightbox
                isOpen={isOpen}
                /* your other props */
            />
        );
        ```

- 21ebe89: One trackpad swipe now pages one image, instead of paging through many as its scroll slows down.

    - A trackpad sends wheel events for about a second after the fingers lift, as its scroll slows down. With 1.9.0, each of those events faster than 1.1px/ms paged. In jsdom, 10 recorded trackpad swipes from Safari and Chrome on macOS and Chrome on Windows each called `onNext` or `onPrev` 22 to 63 times.
    - Now each wheel gesture pages once. A wheel gesture ends 140ms after its last wheel event. Fingers landing on the trackpad for another swipe stop the scroll, so once the scroll is under 0.2px/ms, the next swipe pages too, even before the first swipe's scroll ends.
    - A mouse wheel spun quickly also pages once per spin. With 1.9.0, 6 recorded mouse wheel scrolls from Chrome, Edge, Firefox, and Safari paged 3 to 19 times each.
    - Scrolling still pages only above 1.1px/ms, the first wheel event of a gesture still only measures its speed, and neither ctrl + wheel nor a zoomed-in image pages.
    - Tested by replaying 20 recorded wheel streams from the [wheel-gestures](https://github.com/xiel/wheel-gestures) project with their timing, in jsdom and in Chromium. Each single swipe and mouse wheel scroll paged once, and a recorded double swipe paged twice. The Playwright wheel tests also pass in Firefox. A Mac trackpad was also tried by hand in the repository's demo app. A physical mouse and a Windows touchpad weren't tried by hand.

    Upgrade notes:

    - If a test sends several quick wheel events and expects the lightbox to page more than once, it now pages once. To page again, wait more than 140ms after the last wheel event, or slow the scroll to under 0.2px/ms first.

- ed76418: Fix the image zooming further after the fingers lift from a pinch, so it keeps the zoom the pinch ended on (#17).

    - On touchscreens and with desktop Safari's trackpad pinch, the image took one more zoom step after the gesture ended. In Chromium's Pixel 7 emulation, a pinch held at 1.36x jumped to 1.68x when the fingers lifted.
    - The lightbox cancelled a pinch as it ended, and react-use-gesture 9 then ran the pinch handler once more, which applied the pinch's whole movement again. `@use-gesture/react` doesn't, and the lightbox no longer cancels a pinch that is already ending.
    - A pinch whose fingers lifted before the next animation frame kept its zoom only because of that extra step. When a pinch ends, the lightbox now checks the scale the zoom is animating to instead of the scale on screen, so these pinches keep their zoom too.
    - A ctrl + wheel pinch in Chrome, Edge, and Firefox never had the extra step, and zooms as before.
    - Tested in Chromium with touch input sent through the DevTools protocol, and in jsdom for Safari's gesture events.

- ed76418: Only the primary mouse button drags now, so a drag with the right or middle button no longer pages the gallery or pans a zoomed-in image.

    - react-use-gesture 9 dragged with any button. In Chromium with 1.9.0, a 300px drag with the right button paged to the next image, and an 80px drag with the right button panned a zoomed-in image.
    - `@use-gesture/react` starts a drag only for the primary button by default, and the lightbox keeps that default.
    - Touch input is unchanged.

- 1ae0e83: Opening the lightbox renders each image once instead of twice.

    - With 1.9.0, the pager first rendered every image with `max-height: 100%`, then rendered every image again with the stage height minus 50px. It now uses the stage height in its first render.
    - In Chromium with the CPU slowed down 4x, median of 6 runs: opening a 100-image gallery ran 141ms of JavaScript before and 108ms after. With 1000 images, it ran 644ms before and 472ms after.
    - Together with the change that skips renders of hidden images, the JavaScript heap with 1000 images open, after garbage collection, was 37MB before and 27MB after.
    - Tested together with the other performance changes in this release, with the unit tests on React 19 and React 18.3.1, the Playwright tests in all five browser projects on React 19, and the Chromium Playwright tests on React 18.3.1. The timings come from Chromium only. Timings on real phones, in Firefox and in Safari weren't measured.

- 0ea271f: Widening the window no longer shows the images beside the current one sliding into view.

    - With 1.9.0, the positions of the images on either side of the current one were pixel offsets for the old stage width. A wider window put part of a wide neighbor inside the stage, and the lightbox then animated it back out. In Chromium, widening the window from 1280px to 1600px showed up to 320px of a panorama beside the current image in about 40 frames, about 0.7 seconds. Dragging the window wider showed it in about half the frames. Only images wide enough to reach past their own page showed this, such as panoramas and wide screenshots.
    - Now each image's position is a percentage of the stage width it was laid out for, so the browser moves the images in the same layout that widens the stage. When the lightbox gets the new width, it rescales the positions without moving anything on screen. An image that was sliding when the window changed size keeps sliding from where it is.
    - Narrowing the window never showed this, and still doesn't.
    - Tested with the unit tests on React 19 and React 18.3.1, the Playwright tests in Chromium, Firefox, and mobile Chromium on React 19, and the Chromium Playwright tests on React 18.3.1. A frame-by-frame check in Chromium and Firefox found no neighbor on screen in any frame, whether the window widened at once or in 40px steps. Resizing while an image is zoomed in was not tested. In the repository's perf harness at 1,000 images, dragging showed no measurable change in task or script time, and the open lightbox used about 0.13MB more JavaScript heap, 27.52MB against 27.39MB without this change.

    Upgrade notes:

    - If a test of your app reads the `transform` of a `.lightbox-image-pager` element and expects pixels, it now gets a percentage of the stage width.

        Before:

        ```js
        expect(page.style.transform).toBe('translateX(-1280px)');
        ```

        After:

        ```js
        expect(page.style.transform).toBe('translateX(-100%)');
        ```

- 3a4933c: Build with Rolldown and TypeScript 7 instead of Rollup, Babel, and TypeScript 5, and drop the `@babel/runtime` dependency.

    - `dependencies` no longer lists `@babel/runtime`. The 1.9.0 bundle required `@babel/runtime/helpers/defineProperty`, `@babel/runtime/helpers/extends`, and `@babel/runtime/helpers/objectWithoutProperties`, and neither bundle needs them now.
    - Both bundles target ES2022. Class fields, object spread and rest, and optional chaining stay native, where Babel used to turn class fields and object spread into helper calls. Safari 15.6, Chrome 109, Firefox 102, and later run this syntax, the same browsers the Babel build targeted. A parser that cannot read class fields, such as the one in webpack 4, could not read 1.9.0 either, because 1.9.0 already used optional chaining.
    - The CommonJS bundle went from 12.2 kB to 10.2 kB, or from 4.0 kB to 3.7 kB gzipped. The new ES module bundle is 9.4 kB, or 3.5 kB gzipped.
    - Rolldown's Oxc minifier replaces Terser, so minified names and stack traces differ from 1.9.0. Both bundles ship source maps.
    - TypeScript 7 writes the declarations, and `rolldown-plugin-dts` bundles them into one file per module format.
    - No runtime behavior change is intended. The unit tests run the same user flows against both built bundles, and CI runs the Playwright suite in Chromium, Firefox, and WebKit.
    - Linting, formatting, and the git hooks also moved, to oxlint, oxfmt, and husky 9, but none of that ships in the package.

- ed76418: In desktop Safari, ctrl + wheel now zooms the image toward the cursor, as it already did in Chrome, Edge, and Firefox.

    - With 1.9.0, react-use-gesture 9 listened only for Safari's gesture events there, so a wheel event with `ctrlKey` set left the image alone. `@use-gesture/react` listens for both.
    - A trackpad pinch in Safari still zooms through its gesture events, at the same speed as before.
    - Tested in Playwright's WebKit and in jsdom, not in Safari itself.

- 868eb05: The lightbox's keys now act only while focus is inside it, so text fields, selects, and the page around an inline carousel keep their own keys (#65).

    - With 1.9.0, the lightbox listened for keys on `document` whenever `isOpen` was true. ← and → paged the lightbox while you typed in a text field in its header or footer, and Home, End, ↑, ↓, PageUp, and PageDown did nothing in that field. Escape closed the lightbox even after the field called `preventDefault()`. An inline carousel took ←, →, and Escape from the whole page, even when it was scrolled out of view, and blocked the keys that scroll the page. Every mounted lightbox reacted to each key.
    - Now the lightbox handles keys in an `onKeyDown` on its dialog, or on the carousel's root with `inline`. Keys pressed elsewhere on the page don't reach it.
    - While the modal lightbox is open, it also takes keys pressed while nothing has focus, as if they were pressed in it. Focus falls to `<body>` when the focused control turns disabled or leaves the page, as a Next button rendered with `disabled={!canNext}` does on the last image. Such a key also moves focus back into the lightbox. Tab then goes to its first control and Shift+Tab to its last.
    - ← and → leave text fields, selects, and other editable elements alone. Escape still closes the lightbox from a text field, unless the field calls `preventDefault()` in its own `onKeyDown`.
    - ←, →, and Escape do nothing with Alt, Ctrl, or Cmd held, so browser and system shortcuts such as Alt+← keep working. Keys pressed while an input method composes text do nothing at all. That includes the Escape that cancels a composition in Safari, which fires `compositionend` first and marks that `keydown` only with `keyCode` 229. With 1.9.0, the lightbox didn't check for composition, so the Escape that cancels a Chinese or Japanese composition could close it.
    - The keys act when they go down instead of when they come up. Holding an arrow key still pages once.
    - While the modal lightbox is open, it blocks ↑, ↓, PageUp, PageDown, Home, and End pressed in it, with or without Alt, Ctrl, or Cmd, except in a text field, which keeps them. It blocks Space too, unless Space presses a focused button. With 1.9.0, Space scrolled the page behind the lightbox. Keys pressed in content portaled out of the lightbox, such as a menu that a header button renders into `<body>`, are left to that content. An `inline` carousel never blocks these keys.
    - Tested with the unit tests on React 19 and React 18.3.1, the Playwright tests in Chromium, Firefox, and mobile Chromium on React 19, and the Chromium Playwright tests on React 18.3.1. CI runs the WebKit projects. A unit test covers the Safari input-method case with the `keydown` that Safari sends. It was not tested in Safari with an input method.

    Upgrade notes:

    - If keyboard users page your inline carousel with ← and → while focus is elsewhere on the page, the carousel now ignores those keys. It takes them only while focus is inside it. Render buttons with `renderPrevButton` and `renderNextButton`, so keyboard users can move focus into the carousel.

        Before:

        ```jsx
        <Lightbox
            inline
            isOpen
            /* your other props */
        />
        ```

        After:

        ```jsx
        <Lightbox
            inline
            isOpen
            renderNextButton={({ canNext }) => (
                <button
                    disabled={!canNext}
                    onClick={gotoNext}
                    type="button"
                >
                    Next image
                </button>
            )}
            renderPrevButton={({ canPrev }) => (
                <button
                    disabled={!canPrev}
                    onClick={gotoPrevious}
                    type="button"
                >
                    Previous image
                </button>
            )}
            /* your other props */
        />
        ```

        A button that turns `disabled` while it has focus, as these do at the first and last image, drops focus to the page. The carousel then takes no keys until focus is back inside it.

    - If a test of your app fires key events at `document`, or fires only `keyup`, the lightbox no longer sees them. Fire `keydown` at the focused element, as a browser does.

        Before:

        ```js
        fireEvent.keyUp(document, { key: 'ArrowRight' });
        ```

        After:

        ```js
        fireEvent.keyDown(document.activeElement, { key: 'ArrowRight' });
        ```

- 1ae0e83: Page changes in very large galleries take less time, because hidden images now move without starting an animation.

    - Each page change moved every hidden image to its new place by starting a spring for it. For each spring it starts, react-spring searches its whole frame queue, so a page change took time that grew with the square of the number of images.
    - Hidden images now move with react-spring's `set()`. They end each page change in the same place as before, and the current image and its neighbors animate as before.
    - In Chromium with the CPU slowed down 4x, median of 6 runs, on top of the change that animates only the shown images: four arrow-key presses in a 1000-image gallery ran 780ms of JavaScript before this change and 429ms after, and the longest frame went from 233ms to 133ms. Paging by drag, swipe or trackpad over 1000 images ran 21% to 22% less JavaScript. Galleries of 100 images showed no measurable difference.
    - If an app changes `currentIndex` twice within one animation frame, a hidden page that was still moving now starts again from where it is, at rest, instead of keeping its speed.
    - A new unit test checks that adding images before the shown one, while `currentIndex` moves to keep it in view, leaves it still. Tested together with the other performance changes in this release, with the unit tests on React 19 and React 18.3.1, the Playwright tests in all five browser projects on React 19, and the Chromium Playwright tests on React 18.3.1. The timings come from Chromium only. Timings on real phones, in Firefox and in Safari weren't measured.

- 3a4933c: Ship `CHANGELOG.md` in the npm package, so the release notes are in `node_modules/react-spring-lightbox/CHANGELOG.md` after an install.

    - `files` in `package.json` now lists `CHANGELOG.md` and `MIGRATION.md` next to `dist`. Through 1.9.0, the package held only `dist/`, `package.json`, `README.md`, and `LICENSE`, so the release notes were only on GitHub.
    - No release has a `MIGRATION.md` yet. The first release that needs a step-by-step migration guide ships one at `node_modules/react-spring-lightbox/MIGRATION.md`.
    - Nothing imports either file, so app bundles don't change.

- 1ae0e83: Paging, zooming and closing a large gallery no longer re-renders every image.

    - With 1.9.0, each page change, the start and end of each drag, swipe or wheel gesture, each zoom and each pinch re-rendered every image in `images`. Each render also removed and re-added eight event listeners on the image. Four arrow-key presses in a 1000-image gallery rendered images 4,000 times and added 32,008 listeners.
    - An image more than one page from the current one now renders only when its props change. The same four key presses render images 16 times and add 136 listeners. The current image and its neighbors still render whenever the lightbox does.
    - In Chromium with the CPU slowed down 4x, median of 6 runs, together with the change that animates only the shown images: four arrow-key presses over 100 images took 230ms of main-thread time without this change and 164ms with it. Closing a 1000-image gallery took 248ms from Escape to the next frame before and 100ms after.
    - If an app changes an object in `images` in place, keeping the same object, an image more than one page away now picks up the change when it comes within one page of the current image, instead of on the next render. The current image and its neighbors pick it up on the next render, as before.
    - Tested together with the other performance changes in this release, with the unit tests on React 19 and React 18.3.1, the Playwright tests in all five browser projects on React 19, and the Chromium Playwright tests on React 18.3.1. The timings come from Chromium only. Timings on real phones, in Firefox and in Safari weren't measured.

- 9e8f9c9: Jumping to a distant image now slides the old image out and the new one in, as a one-step page change does.

    - With 1.9.0, changing `currentIndex` by more than one, as a thumbnail click does, hid the old image at once. The stage stayed blank until the new image arrived from as many stage widths away as the jump, and the new image's neighbor streaked across the stage first. In Chromium, after a jump from image 1 to image 50 of 60, the new image took about 460ms to reach the stage.
    - Now the old image slides off one side of the stage, the new image slides on from one stage width away on the other side, and no other image crosses the stage. In the same test the new image reached the stage within 40ms of the jump, and the old image stayed on the stage for about 45 frames as it slid off, as long as in a one-step page change.
    - A page that has to hide while it is still on the stage, such as one still sliding from an earlier page change, now slides the rest of the way off before it hides, instead of vanishing. It leaves just ahead of the image that follows it, so quick arrow-key presses move the images almost like one strip. A page that could leave only by crossing the center hides at once, as the old image past the new one does in a jump right after a step back.
    - A change of `currentIndex` that keeps the same image in view, as when images are added before it, is not a jump. The image now stays still even when it lands on a page that showed another image, where 1.9.0 slid it in from the side.
    - If the images change in the same update as a jump, as when a filter swaps them, the old page hides at once instead of sliding off with one of the new images on it.
    - Changing direction less than about 0.4 seconds after a jump can still look uneven. Stepping back one image shows the incoming image passing over the leaving one, and jumping back carries the leaving image across the stage ahead of the incoming one.
    - Quick paging still brings neighboring images closer than one stage width. With presses or clicks 30ms apart they came as close as 0.65 stage widths, and with presses 150ms apart as close as 0.96. Presses about 60ms apart can show three images for a single frame. A jump 60ms after a step can show three images for up to 5 frames, with two of them as close as about 0.4 stage widths.
    - Tested with the unit tests on React 19 and React 18.3.1, the Playwright tests in all five browser projects on React 19, and the Chromium Playwright tests on React 18.3.1. The jump timings come from Chromium only. The quick-paging measurements come from bursts of five arrow-key presses and five Next or Previous clicks, 30ms to 150ms apart, and from jumps right after a step, in Chromium and Firefox.

    Upgrade notes:

    - If a test of your app expects the old image's page to have `display: none` right after a jump, it now keeps `display: flex` for about 0.7 seconds while the image slides off. Wait for the slide to end, for example with Playwright's `toHaveCSS('display', 'none')` on that image's `.lightbox-image-pager` element, which retries until it passes.

## [1.9.0] - 2026-07-29

- Drop `styled-components` dependency

## [1.8.0] - 2023-10-06

- Add inline mode SSR support
- fix next.js + styled-components + SWC client/server classname mismatch error
- Upgrade several dependencies
    - @react-spring/web ^9.7
    - rollup 3
    - typescript 5

### Potentially Breaking

    This release removes the esm build as it doesn't work well with next.js + SWC compiler

## [1.7.1] - 2022-09-12

### Fixed

- Allow vertical scrolling with an InlineLightbox on mobile (even while finger is over the image)

## [1.7.0] - 2022-07-28

- A few small bug fixes in situations where the `items` array may change size
- Upgrade several dependencies
    - "@react-spring/web": "9.5.2"
    - "rollup": "^2.77.2",

### Added

- `Lightbox` can now be used as a slider component embedded in a page like slick-slider by using the `inline` prop

## [1.6.0] - 2021-06-06

- Upgrade to `@react-spring/web@9.2.1` stable from `@tim-soft/react-spring-web@9.0.0-beta.36`

## [1.5.0] - 2021-02-17

- Rewrite project with typescript 4
- Upgrade `react-use-gesture@7.0.15` to `react-use-gesture@9.0.4`
    - This upgrade should fix some miscellaneous bugs such as `unable to spread non iterable instance` and more consistent trackpad support

### Added

- The `images` prop now accepts a list of objects whose properties can be _almost_ any valid React `<img />` prop including `srcset` and `loading` (lazy loading)

If you use typescript, the exact type can be imported/used like this

```typescript
import Lightbox, { ImagesListType } from 'react-spring-lightbox';

const images: ImagesListType = [
    {
        alt: 'Windows 10 Dark Mode Setting',
        'aria-details': 'Some details',
        'aria-disabled': 'false',
        loading: 'lazy',
        src: 'https://timellenberger.com/static/blog-content/dark-mode/win10-dark-mode.jpg',
        srcSet: '/wp-content/uploads/flamingo4x.jpg 4x, /wp-content/uploads/flamingo3x.jpg 3x, /wp-content/uploads/flamingo2x.jpg 2x, /wp-content/uploads/flamingo1x.jpg 1x',
    },
    {
        alt: 'macOS Mojave Dark Mode Setting',
        'aria-details': 'Some details',
        'aria-disabled': 'false',
        loading: 'lazy',
        src: 'https://timellenberger.com/static/blog-content/dark-mode/macos-dark-mode.png',
        srcSet: '/wp-content/uploads/flamingo4x.jpg 4x, /wp-content/uploads/flamingo3x.jpg 3x, /wp-content/uploads/flamingo2x.jpg 2x, /wp-content/uploads/flamingo1x.jpg 1x',
    },
];

const SimpleLightbox = () => <Lightbox images={images} {...otherProps} />;
```

The exact type is:

```typescript
export type ImagesListItem = Omit<
    React.HTMLProps<HTMLImageElement>,
    'draggable' | 'onClick' | 'onDragStart' | 'ref'
> & { alt: string; loading?: 'auto' | 'eager' | 'lazy'; src: string };
```

Which translates to any React `<img />` prop minus `draggable`, `onClick`, `onDragStart` and `ref` as they are used internally. `alt` and `src` are required and explicitly support `loading` as it is an experimental chrome feature not included in `React.HTMLProps<HTMLImageElement>`.

## [1.4.11] - 2020-06-10

### Fixed

- Use aliased version of react-spring dependencies, fixes "Cannot read property 'ref' of null" error

## [1.4.10] - 2020-05-03

### Added

- Optimize output bundles with Terser
- Apply `babel-plugin-styled-components` babel plugin to optimize styled-components styles

## [1.4.9] - 2020-05-02

### Fixed

- Fix partially off-screen image stage in ie11

### Added

- Upgrade to `rollup@2.7.6`, `react-use-gesture@7.0.15` and `@babel/****@7.9.6`

## [1.4.8] - 2020-04-08

### Fixed

- Dropped `lodash.clamp` dependency
- Call onPrev/onNext callbacks on all paging events, even at the beginning or end of image array to allow for infinite paging

## [1.4.7] - 2020-04-05

### Added

- Lower distance and velocity gesture threshold for a paging between images
- Allow click to zoom while a paging animation completes
- Upgrade to `rollup@2.3.3` and `react-use-gesture@7.0.10`
- Add `sideEffects: false` to `package.json`

## [1.4.6] - 2020-04-04

### Fixed

- Handle edge case bugs with `singleClickToZoom` option
- Fix undefined errors in panning drag handler on initial drags

## [1.4.5] - 2020-03-27

### Added

- Add optional `singleClickToZoom` prop which allows single click/tap zooming on images

## [1.4.4] - 2020-03-24

### Fixed

- Add orientationchange event listener for ios devices

## [1.4.3] - 2020-03-23

### Fixed

- Drop lodash.merge
- Fix image heights not adjusting on window resize

## [1.4.2] - 2020-03-15

### Fixed

- Remove need for react-use-measure and @juggle/resize-observer

## [1.4.1] - 2020-03-13

### Fixed

- Fix image stage height on Safari
- Upgrade to react-use-gesture@7.0.5
- Upgrade to rollup@2.0.6

## [1.4.0] - 2020-03-7

### BREAKING CHANGE

- Replaced inline styles with styled-components. This library now has a peer dependency on `styled-components@5`

### Fixed

- Gigantic initial image size in Firefox and MS Edge
- Click background to close functionality

### Added

- Vendor prefixed styles
- A resize observer polyfill is now included to support MS Edge

## [1.2.1] - 2020-03-5

### Added

- Added `renderImageOverlay` prop, renders a React component within the image stage, useful for creating UI overlays on top of the current image

## [1.2.0] - 2020-02-14

- Upgrade react-use-gesture v6 -> v7
- Upgrade all deps

## [1.1.7] - 2019-09-23

### Fixed

- Improved panning performance
- Tweaked mousewheel swiping threshold
- Upgrade to react-use-gesture v6

## [1.1.4] - 2019-08-27

### Added

- Implement mousewheel paging of images

## [1.1.3] - 2019-08-19

### Fixed

- Prevent vertical dragging from paging images
- Switch to @react-spring/web package

## [1.1.2] - 2019-08-17

### Fixed

- Properly dispose wheel event listener

## [1.1.1] - 2019-08-14

### Fixed

- Adjusted "pan out of bounds" threshold

## [1.1.0] - 2019-08-14

### Added

- Implement proper <kbd>Ctrl</kbd> + `Mousewheel` and `Trackpad Pinch` zooming

## [1.0.1] - 2019-08-7

Add testing suite and travis-ci config

## [1.0.0] - 2019-08-5

Upgrade deps and release as stable

## [0.0.3] - 2019-08-1

### Changed

- Renamed onClickNext => onNext
- Renamed onClickPrev => onPrev

## [0.0.2] - 2019-07-31

Initial Release
