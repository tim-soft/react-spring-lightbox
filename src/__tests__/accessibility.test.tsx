import { render, screen } from '@testing-library/react';
import React, { useEffect, useRef, useState } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import Lightbox from '../index';
import { pressKey } from './devices';
import { lightboxContainer, lightboxProps, mockLayout, settle } from './helpers';

beforeEach(() => {
    mockLayout();
});

/** jsdom has no layout, so every element reports a box unless it, or an ancestor, is display: none */
const stubClientRects = () =>
    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockImplementation(function (this: HTMLElement) {
        return (this.closest('[style*="display: none"]') ? [] : [{}]) as unknown as DOMRectList;
    });

const pressTab = (shiftKey = false) => {
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Tab', shiftKey });
    (document.activeElement as Element).dispatchEvent(event);
    return event;
};

// React calls a stable ref callback once, while it mounts the element, which is when it applies autoFocus
const focusOnMount = (element: HTMLElement | null) => element?.focus();

// A control that turns disabled or leaves the page while it has focus, as Next does on the last image,
// drops focus to <body>. Blurring the focused element gets there in jsdom.
const dropFocus = () => (document.activeElement as HTMLElement).blur();

const Page = ({ focusCloseOnMount = false }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <main>
                <button
                    onClick={() => setIsOpen(true)}
                    type="button"
                >
                    Open
                </button>
            </main>
            <Lightbox
                {...lightboxProps({ isOpen, onClose: () => setIsOpen(false) })}
                renderHeader={() => (
                    <button
                        onClick={() => setIsOpen(false)}
                        ref={focusCloseOnMount ? focusOnMount : undefined}
                        type="button"
                    >
                        Close
                    </button>
                )}
            />
        </>
    );
};

const PageThatMovesFocusOnClose = ({ inAnEffect = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const elsewhere = useRef<HTMLButtonElement>(null);
    const close = () => {
        setIsOpen(false);
        if (!inAnEffect) {
            elsewhere.current?.focus();
        }
    };
    useEffect(() => {
        if (inAnEffect && !isOpen) {
            elsewhere.current?.focus();
        }
    }, [inAnEffect, isOpen]);

    return (
        <>
            <main>
                <button
                    onClick={() => setIsOpen(true)}
                    type="button"
                >
                    Open
                </button>
                <button
                    ref={elsewhere}
                    type="button"
                >
                    Elsewhere
                </button>
            </main>
            <Lightbox
                {...lightboxProps({ isOpen })}
                onClose={close}
                renderHeader={() => (
                    <button
                        onClick={close}
                        type="button"
                    >
                        Close
                    </button>
                )}
            />
        </>
    );
};

const open = async () => {
    const thumbnail = screen.getByRole('button', { name: 'Open' });
    thumbnail.focus();
    thumbnail.click();
    await settle();
    return thumbnail;
};

const close = async () => {
    screen.getByRole('button', { name: 'Close' }).click();
    await settle();
};

describe('as a dialog', () => {
    test('is announced as a modal dialog', async () => {
        render(<Lightbox {...lightboxProps()} />);
        await settle();

        expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
        expect(screen.getByRole('dialog')).toBe(lightboxContainer());
    });

    test('is named by aria-label', async () => {
        render(<Lightbox {...lightboxProps({ 'aria-label': 'Photo viewer' })} />);
        await settle();

        expect(screen.getByRole('dialog', { name: 'Photo viewer' })).toBeInTheDocument();
    });

    test('is named by aria-labelledby', async () => {
        render(
            <>
                <h2 id="title">Holiday photos</h2>
                <Lightbox {...lightboxProps({ 'aria-labelledby': 'title' })} />
            </>
        );
        await settle();

        expect(screen.getByRole('dialog', { name: 'Holiday photos' })).toBeInTheDocument();
    });

    test('has no dialog or inert page while closed', () => {
        render(<Lightbox {...lightboxProps({ isOpen: false })} />);

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(document.querySelector('[inert]')).toBeNull();
    });

    test('an inline carousel is no dialog and leaves the page alone', async () => {
        render(
            <Lightbox
                {...lightboxProps({ inline: true })}
                aria-label="Photo viewer"
            />
        );
        await settle();

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(document.querySelector('[inert]')).toBeNull();
    });
});

describe('focus', () => {
    test('moves into the dialog when it opens', async () => {
        render(<Page />);

        await open();

        expect(document.activeElement).toBe(lightboxContainer());
    });

    test('stays on a control the header focused itself', async () => {
        render(
            <Lightbox
                {...lightboxProps()}
                renderHeader={() => (
                    <input
                        aria-label="Search"
                        ref={focusOnMount}
                    />
                )}
            />
        );
        await settle();

        expect(screen.getByRole('textbox', { name: 'Search' })).toHaveFocus();
    });

    test('returns to what had it before opening when the lightbox closes', async () => {
        render(<Page />);
        const thumbnail = await open();

        await close();

        expect(thumbnail).toHaveFocus();
    });

    test('returns to what had it before opening after a header control focused itself', async () => {
        render(<Page focusCloseOnMount />);
        const thumbnail = await open();
        expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();

        await close();

        expect(thumbnail).toHaveFocus();
    });

    test('returns there even when the close handler moved it elsewhere', async () => {
        render(<PageThatMovesFocusOnClose />);
        const thumbnail = await open();

        await close();

        expect(thumbnail).toHaveFocus();
    });

    test('stays where an effect in the component that renders the lightbox moves it after closing', async () => {
        render(<PageThatMovesFocusOnClose inAnEffect />);
        await open();

        await close();

        expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus();
    });

    test('returns when the open lightbox unmounts', async () => {
        const thumbnail = document.body.appendChild(document.createElement('button'));
        thumbnail.focus();
        const { unmount } = render(<Lightbox {...lightboxProps()} />);
        await settle();
        expect(thumbnail).not.toHaveFocus();

        unmount();

        expect(thumbnail).toHaveFocus();
        expect(document.querySelector('[inert]')).toBeNull();
        thumbnail.remove();
    });
});

describe('the page behind', () => {
    test('is inert while the lightbox is open and works again after it closes', async () => {
        render(<Page />);
        const page = screen.getByRole('main').parentElement as HTMLElement;

        await open();
        expect(page).toHaveAttribute('inert');
        expect(lightboxContainer().closest('[inert]')).toBeNull();

        await close();
        expect(page).not.toHaveAttribute('inert');
    });

    test('keeps what was already inert, inert', async () => {
        const alreadyInert = document.body.appendChild(document.createElement('aside'));
        alreadyInert.setAttribute('inert', '');
        render(<Page />);

        await open();
        await close();

        expect(alreadyInert).toHaveAttribute('inert');
        alreadyInert.remove();
    });

    test('does not make inert what was added to the body after opening', async () => {
        render(<Page />);
        await open();

        const menu = document.body.appendChild(document.createElement('div'));
        await close();

        expect(menu).not.toHaveAttribute('inert');
        menu.remove();
    });
});

describe('Tab', () => {
    const renderWithControls = async (controls: React.ReactNode = null) => {
        stubClientRects();
        render(
            <Lightbox
                {...lightboxProps()}
                renderFooter={() => controls}
                renderHeader={() => <button type="button">First</button>}
                renderNextButton={() => <button type="button">Last</button>}
            />
        );
        await settle();
    };

    test('wraps from the last control to the first', async () => {
        await renderWithControls();
        screen.getByRole('button', { name: 'Last' }).focus();

        expect(pressTab().defaultPrevented).toBe(true);

        expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
    });

    test('wraps from the first control to the last with Shift', async () => {
        await renderWithControls();
        screen.getByRole('button', { name: 'First' }).focus();

        expect(pressTab(true).defaultPrevented).toBe(true);

        expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus();
    });

    test('wraps from the dialog itself to the last control with Shift', async () => {
        await renderWithControls();
        lightboxContainer().focus();

        expect(pressTab(true).defaultPrevented).toBe(true);

        expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus();
    });

    test('leaves a Tab between controls to the browser', async () => {
        await renderWithControls();
        screen.getByRole('button', { name: 'First' }).focus();
        expect(pressTab().defaultPrevented).toBe(false);

        screen.getByRole('button', { name: 'Last' }).focus();
        expect(pressTab(true).defaultPrevented).toBe(false);
    });

    test('keeps focus on the dialog when it has no controls', async () => {
        stubClientRects();
        render(<Lightbox {...lightboxProps()} />);
        await settle();
        expect(document.activeElement).toBe(lightboxContainer());

        expect(pressTab().defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(lightboxContainer());
        expect(pressTab(true).defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(lightboxContainer());
    });

    test('skips disabled, hidden and unfocusable controls', async () => {
        await renderWithControls(
            <>
                <button
                    disabled
                    type="button"
                >
                    Disabled
                </button>
                <button
                    style={{ display: 'none' }}
                    type="button"
                >
                    Hidden
                </button>
                <button
                    tabIndex={-1}
                    type="button"
                >
                    Skipped
                </button>
            </>
        );
        screen.getByRole('button', { name: 'Last' }).focus();

        pressTab();

        expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
    });

    test('ignores every other key', async () => {
        await renderWithControls();
        const last = screen.getByRole('button', { name: 'Last' });
        last.focus();

        pressKey('Enter', last);

        expect(last).toHaveFocus();
    });

    test('from <body> moves on from the dialog, so the browser goes to the first control', async () => {
        await renderWithControls();
        dropFocus();

        expect(pressTab().defaultPrevented).toBe(false);

        expect(document.activeElement).toBe(lightboxContainer());
    });

    test('from <body> with Shift goes to the last control', async () => {
        await renderWithControls();
        dropFocus();

        expect(pressTab(true).defaultPrevented).toBe(true);

        expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus();
    });
});

describe('a key pressed after focus falls to <body>', () => {
    test.each([
        ['Esc asks to close', 'Escape', 'onClose'],
        ['← pages back', 'ArrowLeft', 'onPrev'],
        ['→ pages on', 'ArrowRight', 'onNext'],
    ] as const)('%s', async (_, key, callback) => {
        const props = lightboxProps();
        render(<Lightbox {...props} />);
        await settle();
        dropFocus();

        pressKey(key);

        expect(props[callback]).toHaveBeenCalledTimes(1);
    });

    test('moves focus back into the dialog', async () => {
        render(<Lightbox {...lightboxProps()} />);
        await settle();
        dropFocus();
        expect(document.activeElement).toBe(document.body);

        pressKey('Shift');

        expect(document.activeElement).toBe(lightboxContainer());
    });

    test('does not scroll the page behind', async () => {
        render(<Lightbox {...lightboxProps()} />);
        await settle();
        dropFocus();

        expect(pressKey('ArrowDown').defaultPrevented).toBe(true);
    });

    test('does nothing once the lightbox has closed', async () => {
        const props = lightboxProps();
        const { rerender } = render(<Lightbox {...props} />);
        await settle();
        rerender(
            <Lightbox
                {...props}
                isOpen={false}
            />
        );
        await settle();

        expect(pressKey('ArrowDown', document.body).defaultPrevented).toBe(false);
        pressKey('Escape', document.body);
        expect(props.onClose).not.toHaveBeenCalled();
    });
});
