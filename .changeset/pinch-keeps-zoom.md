---
'react-spring-lightbox': patch
---

Fix the image zooming further after the fingers lift from a pinch, so it keeps the zoom the pinch ended on (#17).

- On touchscreens and with desktop Safari's trackpad pinch, the image took one more zoom step after the gesture ended. In Chromium's Pixel 7 emulation, a pinch held at 1.36x jumped to 1.68x when the fingers lifted.
- The lightbox cancelled a pinch as it ended, and react-use-gesture 9 then ran the pinch handler once more, which applied the pinch's whole movement again. `@use-gesture/react` doesn't, and the lightbox no longer cancels a pinch that is already ending.
- A pinch whose fingers lifted before the next animation frame kept its zoom only because of that extra step. When a pinch ends, the lightbox now checks the scale the zoom is animating to instead of the scale on screen, so these pinches keep their zoom too.
- A ctrl + wheel pinch in Chrome, Edge, and Firefox never had the extra step, and zooms as before.
- Tested in Chromium with touch input sent through the DevTools protocol, and in jsdom for Safari's gesture events.
