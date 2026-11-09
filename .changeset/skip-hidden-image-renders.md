---
'react-spring-lightbox': patch
---

Paging, zooming and closing a large gallery no longer re-renders every image.

- With 1.9.0, each page change, the start and end of each drag, swipe or wheel gesture, each zoom and each pinch re-rendered every image in `images`. Each render also removed and re-added eight event listeners on the image. Four arrow-key presses in a 1000-image gallery rendered images 4,000 times and added 32,008 listeners.
- An image more than one page from the current one now renders only when its props change. The same four key presses render images 16 times and add 136 listeners. The current image and its neighbors still render whenever the lightbox does.
- In Chromium with the CPU slowed down 4x, median of 6 runs, together with the change that animates only the shown images: four arrow-key presses over 100 images took 230ms of main-thread time without this change and 164ms with it. Closing a 1000-image gallery took 248ms from Escape to the next frame before and 100ms after.
- If an app changes an object in `images` in place, keeping the same object, an image more than one page away now picks up the change when it comes within one page of the current image, instead of on the next render. The current image and its neighbors pick it up on the next render, as before.
