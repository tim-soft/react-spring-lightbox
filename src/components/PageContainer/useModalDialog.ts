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
        if (!dialog.contains(document.activeElement)) {
            dialog.focus();
        }

        return () => {
            freePageBehind();
            returnFocusTo.focus();
        };
    }, [focusedBeforeOpen, isOpen]);

    // With the page inert, Tab from the last control would land on <body>
    const wrapTab = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'Tab') {
            return;
        }
        const dialog = event.currentTarget;
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

    return { dialogRef, wrapTab };
};

export default useModalDialog;
