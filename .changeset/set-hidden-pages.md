---
'react-spring-lightbox': patch
---

Page changes in very large galleries take less time, because hidden images now move without starting an animation.

- Each page change moved every hidden image to its new place by starting a spring for it. For each spring it starts, react-spring searches its whole frame queue, so a page change took time that grew with the square of the number of images.
- Hidden images now move with react-spring's `set()`. They end each page change in the same place as before, and the current image and its neighbors animate as before.
- In Chromium with the CPU slowed down 4x, median of 6 runs, on top of the change that animates only the shown images: four arrow-key presses in a 1000-image gallery ran 780ms of JavaScript before this change and 429ms after, and the longest frame went from 233ms to 133ms. Paging by drag, swipe or trackpad over 1000 images ran 21% to 22% less JavaScript. Galleries of 100 images showed no measurable difference.
- If an app changes `currentIndex` twice within one animation frame, a hidden page that was still moving now starts again from where it is, at rest, instead of keeping its speed.
- A new unit test checks that adding images before the shown one, while `currentIndex` moves to keep it in view, leaves it still. Tested together with the other performance changes in this release, with the unit tests on React 19 and React 18.3.1, the Playwright tests in all five browser projects on React 19, and the Chromium Playwright tests on React 18.3.1. The timings come from Chromium only. Timings on real phones, in Firefox and in Safari weren't measured.
