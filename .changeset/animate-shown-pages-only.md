---
'react-spring-lightbox': patch
---

Dragging, swiping, scrolling and paging through a large gallery takes less CPU time, because the lightbox now animates only the current image and its neighbors.

- With 1.9.0, each page change and each move of a drag, swipe or wheel gesture started a spring for every image in `images`, including the hidden images more than one page away. Each of those springs then wrote a CSS transform on every animation frame. In Chromium, a 1.3-second drag over a 1000-image gallery wrote 117,000 transforms.
- Hidden images now jump to their new place in one frame, and drags and wheel gestures leave them alone. The same drag writes 351 transforms.
- In Chromium with the CPU slowed down 4x, median of 6 runs: holding a drag over 100 images took 503ms of main-thread time before and 163ms after. Over 1000 images, the same drag dropped 85 frames before and 4 after. Galleries of 5 images showed no measurable difference.
- The current image and its neighbors move as before. Tested with the unit tests on React 19 and React 18.3.1, the Playwright tests in all five browser projects on React 19, and the Chromium Playwright tests on React 18.3.1.
