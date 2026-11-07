---
'react-spring-lightbox': patch
---

Replace the deprecated `react-use-gesture` with its successor, `@use-gesture/react`, so installing the lightbox no longer prints a deprecation warning (#52).

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
