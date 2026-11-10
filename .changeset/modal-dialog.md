---
'react-spring-lightbox': minor
---

The open lightbox is now a modal dialog that keyboard and screen reader users can work with, and it gives focus back when it closes.

- The lightbox container has `role="dialog"`, `aria-modal="true"`, and `tabindex="-1"`. The new optional props `aria-label` and `aria-labelledby` name the dialog. Without either prop, screen readers announce a dialog with no name.
- Opening the lightbox moves focus to the container, unless a control inside it already has focus, such as a button with `autoFocus` in `renderHeader`. With 1.9.0, focus stayed on the element that opened the lightbox, under the overlay. After a keyboard user opened an image with Enter and paged with the arrow keys, the next Enter pressed that hidden thumbnail again and jumped back to its image.
- While the lightbox is open, each other child of `<body>` has the `inert` attribute, so Tab and screen readers can't reach the page behind it. With 1.9.0, Tab moved through the whole page behind the overlay before it reached the lightbox's own controls. Elements added to `<body>` after the lightbox opens, such as a menu that a header button portals to `<body>`, stay usable.
- Tab from the last control in the lightbox moves focus to the first one, and Shift+Tab from the first moves focus to the last.
- Closing the lightbox, or unmounting it while it's open, removes the `inert` attributes that it added and moves focus back to the element that had focus before it opened. With 1.9.0, pressing a close button inside the lightbox dropped focus to `<body>`, so the next Tab started from the top of the page.
- An `inline` lightbox doesn't change.
- Tested with the unit tests on React 19 and React 18.3.1, the Playwright tests in Chromium, Firefox, and mobile Chromium on React 19, and the Chromium Playwright tests on React 18.3.1. CI runs the WebKit projects. No screen reader was tested, but Chromium's accessibility tree listed only the lightbox's dialog and its controls while it was open.

Upgrade notes:

- If a screen reader announces your lightbox only as "dialog", the dialog has no name. Pass `aria-label`, or pass `aria-labelledby` with the `id` of a title in your header.

    Before:

    ```jsx
    <Lightbox
        isOpen={isOpen}
        /* your other props */
    />
    ```

    After:

    ```jsx
    <Lightbox
        aria-label="Product photos"
        isOpen={isOpen}
        /* your other props */
    />
    ```

- If your page keeps a control usable over the open lightbox, such as a toolbar that sits above it with a higher `z-index`, that control is now inert while the lightbox is open. Clicks and Tab skip it. To check, open the lightbox and look for an `inert` attribute on the control or one of its ancestors in your browser's element inspector. To keep the control usable, render it in `renderHeader`, `renderFooter`, or `renderImageOverlay`.

    Before:

    ```jsx
    <>
        <Toolbar style={{ position: 'fixed', top: 0, zIndex: 500 }} />
        <Lightbox
            isOpen={isOpen}
            /* your other props */
        />
    </>
    ```

    After:

    ```jsx
    <Lightbox
        isOpen={isOpen}
        renderHeader={() => <Toolbar />}
        /* your other props */
    />
    ```

- If your `onClose` handler moves focus to another element, focus now ends on the element that opened the lightbox instead. The lightbox moves focus back after `onClose` returns, so it overrides a `focus()` call inside the handler. Move focus in a `useEffect` that runs when `isOpen` changes to `false`, in the component that renders `<Lightbox>`. That effect runs after the lightbox moves focus back.

    Before:

    ```jsx
    const close = () => {
        setIsOpen(false);
        searchRef.current.focus();
    };
    ```

    After:

    ```jsx
    const focusSearchAfterClose = useRef(false);
    const close = () => {
        focusSearchAfterClose.current = true;
        setIsOpen(false);
    };

    useEffect(() => {
        if (!isOpen && focusSearchAfterClose.current) {
            focusSearchAfterClose.current = false;
            searchRef.current.focus();
        }
    }, [isOpen]);
    ```

- In a browser that doesn't support the `inert` attribute, Tab and screen readers can still reach the page behind the open lightbox, as they could with 1.9.0. If your app supports such browsers, load an `inert` polyfill such as `wicg-inert`.
