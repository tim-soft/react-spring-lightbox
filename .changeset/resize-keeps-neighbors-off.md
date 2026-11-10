---
'react-spring-lightbox': patch
---

Widening the window no longer shows the images beside the current one sliding into view.

- With 1.9.0, the positions of the images on either side of the current one were pixel offsets for the old stage width. A wider window put part of a wide neighbor inside the stage, and the lightbox then animated it back out. In Chromium, widening the window from 1280px to 1600px showed up to 320px of a panorama beside the current image in about 40 frames, about 0.7 seconds. Dragging the window wider showed it in about half the frames. Only images wide enough to reach past their own page showed this, such as panoramas and wide screenshots.
- Now each image's position is a percentage of the stage width it was laid out for, so the browser moves the images in the same layout that widens the stage. When the lightbox gets the new width, it rescales the positions without moving anything on screen. An image that was sliding when the window changed size keeps sliding from where it is.
- Narrowing the window never showed this, and still doesn't.
- Tested with the unit tests on React 19 and React 18.3.1, the Playwright tests in Chromium, Firefox, and mobile Chromium on React 19, and the Chromium Playwright tests on React 18.3.1. A frame-by-frame check in Chromium found no neighbor on screen in any frame, whether the window widened at once or in 40px steps. In the repository's perf harness at 1,000 images, dragging showed no measurable change in task or script time, and the open lightbox used about 0.13MB more JavaScript heap, 27.52MB against 27.39MB without this change.

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
