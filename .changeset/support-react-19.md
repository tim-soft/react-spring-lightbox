---
'react-spring-lightbox': minor
---

Support React 19 by moving to `@react-spring/web` 10, and fix two-finger pinch zoom stopping after its first step under React 19.

- `dependencies` now has `@react-spring/web` `^10.1.2`, up from `^9.7.3`. Version 9 declares `react` and `react-dom` peers of `^16.8.0 || ^17.0.0 || ^18.0.0`, and version 10 adds `^19.0.0`. The lightbox's own peers stay `react >=16.8` and `react-dom >=16.8`.
- With 1.9.0 next to React 19, npm 11 prints `npm warn ERESOLVE overriding peer dependency` and installs `@react-spring/web` 9.7.5 anyway. With `--strict-peer-deps`, npm stops with `npm error code ERESOLVE` and lists `@react-spring/web@"^9.7.3" from react-spring-lightbox@1.9.0` under `Could not resolve dependency:`. This release installs next to React 19 without either message.
- Under React 19, a two-finger pinch zoomed for one step and then stopped. When the second finger landed, `ImagePager` marked itself as dragging and cancelled the drag. Its drag-end handler cleared that flag only inside an `if (isDragging)` check, which read a stale `false` because React 19 had not yet re-rendered the pager with the new value. The flag stayed set, and the image ignores pinches while the pager is dragging. The drag-end handler now always moves the pages back to their resting positions and clears the flag 100 ms after the gesture ends.
- React 18 keeps working. The unit tests and the Chromium Playwright tests pass against React 18.3.1 as well as React 19. The peer range still includes React 16.8 and 17, which this release was not tested against.

Upgrade notes:

- If your app also depends on `@react-spring/web` 9, npm installs a second copy for the lightbox, and `npm ls @react-spring/web` lists 9.x at the top level and 10.x under `react-spring-lightbox`. Your bundle then carries both copies. Settings you apply through `Globals.assign`, such as `skipAnimation` in a test setup file, reach only your copy, so the lightbox's springs keep animating. Move your app to `@react-spring/web` 10 so both share one copy.
