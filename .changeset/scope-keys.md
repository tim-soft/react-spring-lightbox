---
'react-spring-lightbox': patch
---

The lightbox's keys now act only while focus is inside it, so text fields, selects, and the page around an inline carousel keep their own keys (#65).

- With 1.9.0, the lightbox listened for keys on `document` whenever `isOpen` was true. ← and → paged the lightbox while you typed in a text field in its header or footer, and Home, End, ↑, ↓, PageUp, and PageDown did nothing in that field. Escape closed the lightbox even after the field called `preventDefault()`. An inline carousel took ←, →, and Escape from the whole page, even when it was scrolled out of view, and blocked the keys that scroll the page. Every mounted lightbox reacted to each key.
- Now the lightbox handles keys in an `onKeyDown` on its dialog, or on the carousel's root with `inline`. Keys pressed elsewhere on the page don't reach it.
- While the modal lightbox is open, it also takes keys pressed while nothing has focus. Focus falls to `<body>` when the focused control turns disabled or leaves the page, as a Next button rendered with `disabled={!canNext}` does on the last image. Such a key moves focus back into the lightbox. Tab then goes to its first control and Shift+Tab to its last.
- ← and → leave text fields, selects, and other editable elements alone. Escape still closes the lightbox from a text field, unless the field calls `preventDefault()` in its own `onKeyDown`.
- ←, →, and Escape do nothing with Alt, Ctrl, or Cmd held, so browser and system shortcuts such as Alt+← keep working. Keys pressed while an input method composes text do nothing at all.
- The keys act when they go down instead of when they come up. Holding an arrow key still pages once.
- While the modal lightbox is open, ↑, ↓, PageUp, PageDown, Home, and End don't scroll the page behind it, with or without Alt, Ctrl, or Cmd, unless a text field has focus. Space doesn't scroll it either, unless Space presses a focused button. With 1.9.0, Space scrolled the page behind the lightbox. An `inline` carousel never blocks these keys.
- Tested with the unit tests on React 19 and React 18.3.1, the Playwright tests in Chromium, Firefox, and mobile Chromium on React 19, and the Chromium Playwright tests on React 18.3.1. CI runs the WebKit projects.

Upgrade notes:

- If keyboard users page your inline carousel with ← and → while focus is elsewhere on the page, the carousel now ignores those keys. It takes them only while focus is inside it. Render buttons with `renderPrevButton` and `renderNextButton`, so keyboard users can move focus into the carousel.

    Before:

    ```jsx
    <Lightbox
        inline
        isOpen
        /* your other props */
    />
    ```

    After:

    ```jsx
    <Lightbox
        inline
        isOpen
        renderNextButton={({ canNext }) => (
            <button
                disabled={!canNext}
                onClick={gotoNext}
                type="button"
            >
                Next image
            </button>
        )}
        renderPrevButton={({ canPrev }) => (
            <button
                disabled={!canPrev}
                onClick={gotoPrevious}
                type="button"
            >
                Previous image
            </button>
        )}
        /* your other props */
    />
    ```

- If a test of your app fires key events at `document`, or fires only `keyup`, the lightbox no longer sees them. Fire `keydown` at the focused element, as a browser does.

    Before:

    ```js
    fireEvent.keyUp(document, { key: 'ArrowRight' });
    ```

    After:

    ```js
    fireEvent.keyDown(document.activeElement, { key: 'ArrowRight' });
    ```
