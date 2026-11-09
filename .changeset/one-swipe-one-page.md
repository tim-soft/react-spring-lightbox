---
'react-spring-lightbox': patch
---

One trackpad swipe now pages one image, instead of paging through many as its scroll slows down.

- A trackpad sends wheel events for about a second after the fingers lift, as its scroll slows down. With 1.9.0, each of those events faster than 1.1px/ms paged. In jsdom, 10 recorded trackpad swipes from Safari and Chrome on macOS and Chrome on Windows each called `onNext` or `onPrev` 22 to 63 times.
- Now each wheel gesture pages once. A wheel gesture ends 140ms after its last wheel event. Fingers landing on the trackpad for another swipe stop the scroll, so once the scroll is under 0.2px/ms, the next swipe pages too, even before the first swipe's scroll ends.
- A mouse wheel spun quickly also pages once per spin. With 1.9.0, 6 recorded mouse wheel scrolls from Chrome, Edge, Firefox, and Safari paged 3 to 19 times each.
- Scrolling still pages only above 1.1px/ms, the first wheel event of a gesture still only measures its speed, and neither ctrl + wheel nor a zoomed-in image pages.
- Tested by replaying 20 recorded wheel streams from the [wheel-gestures](https://github.com/xiel/wheel-gestures) project with their timing, in jsdom and in Chromium. Each single swipe and mouse wheel scroll paged once, and a recorded double swipe paged twice. The Playwright wheel tests also pass in Firefox. A Mac trackpad was also tried by hand in the repository's demo app. A physical mouse and a Windows touchpad weren't tried by hand.

Upgrade notes:

- If a test sends several quick wheel events and expects the lightbox to page more than once, it now pages once. To page again, wait more than 140ms after the last wheel event, or slow the scroll to under 0.2px/ms first.
