---
'react-spring-lightbox': patch
---

Only the primary mouse button drags now, so a drag with the right or middle button no longer pages the gallery or pans a zoomed-in image.

- react-use-gesture 9 dragged with any button. In Chromium with 1.9.0, a 300px drag with the right button paged to the next image, and an 80px drag with the right button panned a zoomed-in image.
- `@use-gesture/react` starts a drag only for the primary button by default, and the lightbox keeps that default.
- Touch input is unchanged.
