---
'react-spring-lightbox': patch
---

Jumping to a distant image now slides the old image out and the new one in, as a one-step page change does.

- With 1.9.0, changing `currentIndex` by more than one, as a thumbnail click does, hid the old image at once. The stage stayed blank until the new image arrived from as many stage widths away as the jump, and the new image's neighbor streaked across the stage first. In Chromium, after a jump from image 1 to image 50 of 60, the new image took about 460ms to reach the stage.
- Now the old image slides off one side of the stage, the new image slides on from one stage width away on the other side, and no other image crosses the stage. In the same test the new image reached the stage within 40ms of the jump, and the old image stayed on the stage for about 45 frames as it slid off, as long as in a one-step page change.
- A page that has to hide while it is still on the stage, such as one still sliding from an earlier page change, now slides the rest of the way off before it hides, instead of vanishing. It leaves just ahead of the image that follows it, so quick arrow-key presses move the images almost like one strip. A page that could leave only by crossing the center hides at once, as the old image past the new one does in a jump right after a step back.
- A change of `currentIndex` that keeps the same image in view, as when images are added before it, is not a jump. The image now stays still even when it lands on a page that showed another image, where 1.9.0 slid it in from the side.
- If the images change in the same update as a jump, as when a filter swaps them, the old page hides at once instead of sliding off with one of the new images on it.
- Changing direction less than about 0.4 seconds after a jump can still look uneven. Stepping back one image shows the incoming image passing over the leaving one, and jumping back carries the leaving image across the stage ahead of the incoming one.
- Quick paging still brings neighboring images closer than one stage width. With presses or clicks 30ms apart they came as close as 0.65 stage widths, and with presses 150ms apart as close as 0.96. Presses about 60ms apart can show three images for a single frame. A jump 60ms after a step can show three images for up to 5 frames, with two of them as close as about 0.4 stage widths.
- Tested with the unit tests on React 19 and React 18.3.1, the Playwright tests in all five browser projects on React 19, and the Chromium Playwright tests on React 18.3.1. The jump timings come from Chromium only. The quick-paging measurements come from bursts of five arrow-key presses and five Next or Previous clicks, 30ms to 150ms apart, and from jumps right after a step, in Chromium and Firefox.

Upgrade notes:

- If a test of your app expects the old image's page to have `display: none` right after a jump, it now keeps `display: flex` for about 0.7 seconds while the image slides off. Wait for the slide to end, for example with Playwright's `toHaveCSS('display', 'none')` on that image's `.lightbox-image-pager` element, which retries until it passes.
