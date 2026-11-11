---
'react-spring-lightbox': patch
---

The page behind the open lightbox no longer scrolls.

- With 1.9.0, a swipe up or down on the lightbox's header or footer on a touchscreen scrolled the page behind it, because only the image stage set `touch-action: none`.
- Now the modal lightbox sets `overflow: hidden` on `<html>` while it is open. Neither touch nor the keys that a text field or a menu portaled to `<body>` leaves to the browser scroll the page behind it. When the lightbox closes, it puts back the inline `overflow` that it found on `<html>`, and the page is where it was.
- If the page's scrollbar took up space, as classic scrollbars on Windows do, the lightbox adds that width to the `padding-right` of `<html>` while it is open, so the page behind doesn't shift when the scrollbar goes away. A scrollbar that overlays the page, as on macOS with a trackpad, takes up no space and adds no padding.
- An `inline` carousel leaves the page alone.
- Tested with the unit tests on React 19 and React 18.3.1, the Playwright tests in Chromium, Firefox, WebKit, and mobile Chromium on React 19, and the Chromium Playwright tests on React 18.3.1. The check that the page doesn't shift runs in WebKit only, because Playwright's Chromium hides scrollbars and Firefox ignores `::-webkit-scrollbar`. Not tested in Safari on iOS, or on a real touchscreen.

Upgrade notes:

- If your app sets `overflow` or `padding-right` on `<html>` while the lightbox is open, for example to stop the page from scrolling, you can remove that code. If you keep it, set it before `isOpen` turns true, and remove it after the lightbox closes. When the lightbox closes, it puts back the inline values that it found on `<html>` when it opened.
