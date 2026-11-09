---
'react-spring-lightbox': patch
---

Opening the lightbox renders each image once instead of twice.

- With 1.9.0, the pager first rendered every image with `max-height: 100%`, then rendered every image again with the stage height minus 50px. It now uses the stage height in its first render.
- In Chromium with the CPU slowed down 4x, median of 6 runs: opening a 100-image gallery ran 141ms of JavaScript before and 108ms after. With 1000 images, it ran 644ms before and 472ms after.
- Together with the change that skips renders of hidden images, the JavaScript heap with 1000 images open, after garbage collection, was 37MB before and 27MB after.
- Tested together with the other performance changes in this release, with the unit tests on React 19 and React 18.3.1, the Playwright tests in all five browser projects on React 19, and the Chromium Playwright tests on React 18.3.1. The timings come from Chromium only. Timings on real phones, in Firefox and in Safari weren't measured.
