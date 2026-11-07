---
'react-spring-lightbox': patch
---

In desktop Safari, ctrl + wheel now zooms the image toward the cursor, as it already did in Chrome, Edge, and Firefox.

- With 1.9.0, react-use-gesture 9 listened only for Safari's gesture events there, so a wheel event with `ctrlKey` set left the image alone. `@use-gesture/react` listens for both.
- A trackpad pinch in Safari still zooms through its gesture events, at the same speed as before.
- Tested in Playwright's WebKit and in jsdom, not in Safari itself.
