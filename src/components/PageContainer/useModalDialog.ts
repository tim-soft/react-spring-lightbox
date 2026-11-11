import type React from 'react';

import { useEffect, useRef, useState } from 'react';

const FOCUSABLE =
    'a[href], area[href], button, input, select, textarea, summary, iframe, audio[controls], video[controls], [contenteditable], [tabindex]';

const isRendered = (element: Element) => element.getClientRects().length > 0;

const tabStops = (dialog: HTMLElement) =>
    Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.tabIndex >= 0 && !element.matches(':disabled') && isRendered(element)
    );

const makePageBehindInert = (dialog: Element) => {
    const madeInert = Array.from(document.body.children).filter(
        (element) => !element.contains(dialog) && !element.hasAttribute('inert')
    );
    madeInert.forEach((element) => element.setAttribute('inert', ''));
    return () => madeInert.forEach((element) => element.removeAttribute('inert'));
};

// Inert content still scrolls, as with the keys that a text field or a menu portaled to <body> leaves
// to the browser, and with touches outside the image stage. Hiding the page's overflow stops them all.
const lockPageScroll = () => {
    const root = document.documentElement;
    const { overflow, paddingRight } = root.style;
    const widthWithScrollbar = root.clientWidth;
    root.style.overflow = 'hidden';
    // A scrollbar that took up space goes away with the overflow, so padding takes its place
    const scrollbarWidth = root.clientWidth - widthWithScrollbar;
    if (scrollbarWidth > 0) {
        const padding = parseFloat(getComputedStyle(root).paddingRight) || 0;
        root.style.paddingRight = `${padding + scrollbarWidth}px`;
    }
    return () => {
        root.style.overflow = overflow;
        root.style.paddingRight = paddingRight;
    };
};

// With the page inert, Tab from the last control would land on <body>
const keepTabInside = (event: Pick<KeyboardEvent, 'key' | 'preventDefault' | 'shiftKey'>, dialog: HTMLElement) => {
    if (event.key !== 'Tab') {
        return;
    }
    const stops = tabStops(dialog);
    const first = stops[0];
    const last = stops[stops.length - 1];
    const { activeElement } = document;

    if (stops.length === 0) {
        event.preventDefault();
        dialog.focus();
    } else if (event.shiftKey && (activeElement === first || activeElement === dialog)) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
    }
};

const useModalDialog = (isOpen: boolean) => {
    const dialogRef = useRef<HTMLDivElement>(null);
    // A control with autoFocus inside the lightbox takes focus before effects run, so the element to
    // return focus to is read while rendering the update that opens the lightbox
    const [wasOpen, setWasOpen] = useState(false);
    const [focusedBeforeOpen, setFocusedBeforeOpen] = useState<Element | null>(null);
    if (isOpen !== wasOpen) {
        setWasOpen(isOpen);
        setFocusedBeforeOpen(isOpen ? document.activeElement : null);
    }

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }
        const dialog = dialogRef.current!;
        const returnFocusTo = focusedBeforeOpen as HTMLElement;
        const freePageBehind = makePageBehindInert(dialog);
        const unlockPageScroll = lockPageScroll();
        if (!dialog.contains(document.activeElement)) {
            dialog.focus();
        }
        // A control that turns disabled or leaves the page while it has focus drops focus to <body>,
        // and Tab from there finds no way back past the inert page
        const takeFocusBack = (event: KeyboardEvent) => {
            if (event.target === document.body) {
                dialog.focus();
                keepTabInside(event, dialog);
            }
        };
        document.addEventListener('keydown', takeFocusBack);

        return () => {
            document.removeEventListener('keydown', takeFocusBack);
            freePageBehind();
            unlockPageScroll();
            returnFocusTo.focus();
        };
    }, [focusedBeforeOpen, isOpen]);

    const wrapTab = (event: React.KeyboardEvent<HTMLDivElement>) => keepTabInside(event, event.currentTarget);

    return { dialogRef, wrapTab };
};

export default useModalDialog;
