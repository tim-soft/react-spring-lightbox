import { act, fireEvent, render, screen } from '@testing-library/react';
import React, { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import Lightbox from '../index';
import { pressKey, touchscreen, wheel } from './devices';
import {
    FRAME,
    advance,
    containerAppearance,
    image,
    lightboxProps,
    mockLayout,
    pageOf,
    settle,
    shownImage,
} from './helpers';

// How apps embed the lightbox: dev-mode React, server rendering, parents that
// control navigation, and more than one lightbox on a page

const SHORT_LEFT: [number, number][] = [
    [600, 300],
    [560, 300],
];

beforeEach(() => {
    mockLayout();
});

describe('in React StrictMode, as Next.js and Create React App run in development', () => {
    test('creates one portal and calls back once per key press', async () => {
        const props = lightboxProps({ currentIndex: 2 });
        const { unmount } = render(
            <StrictMode>
                <Lightbox {...props} />
            </StrictMode>
        );
        await settle();

        pressKey('ArrowRight');
        pressKey('Escape');

        expect(document.querySelectorAll('.lightbox-portal')).toHaveLength(1);
        expect(props.onNext).toHaveBeenCalledTimes(1);
        expect(props.onClose).toHaveBeenCalledTimes(1);

        unmount();
        expect(document.querySelector('.lightbox-portal')).toBeNull();
    });
});

describe('server rendering, then hydrating in the browser', () => {
    const hydrate = async (element: React.ReactElement, html: string) => {
        const errors = vi.spyOn(console, 'error');
        const container = document.createElement('div');
        container.innerHTML = html;
        document.body.append(container);

        const root = await act(async () => hydrateRoot(container, element));
        await settle();

        return {
            container,
            errors,
            unmount: () =>
                act(() => {
                    root.unmount();
                    container.remove();
                }),
        };
    };

    test('an inline carousel hydrates without warnings, then lays out its pager', async () => {
        const element = <Lightbox {...lightboxProps({ inline: true })} />;
        const { container, errors, unmount } = await hydrate(element, renderToString(element));

        expect(errors).not.toHaveBeenCalled();
        expect(container.querySelectorAll('.lightbox-image-pager')).toHaveLength(5);
        unmount();
    });

    test('a modal hydrates without warnings, then opens', async () => {
        const element = <Lightbox {...lightboxProps()} />;
        const { errors, unmount } = await hydrate(element, '');

        expect(errors).not.toHaveBeenCalled();
        expect(screen.getByTestId('lightbox-container')).toBeInTheDocument();
        unmount();
    });
});

describe('a parent that controls navigation', () => {
    test('can veto paging: the pages spring back if currentIndex does not change', async () => {
        const props = lightboxProps({ currentIndex: 2 });
        render(<Lightbox {...props} />);
        await settle();

        await touchscreen.swipe(pageOf(3), SHORT_LEFT);
        await settle();

        expect(props.onNext).toHaveBeenCalledTimes(1);
        expect(shownImage()).toBe('Image 3');
    });

    test('can reopen it on another image while it is still closing', async () => {
        const props = lightboxProps();
        const { rerender } = render(<Lightbox {...props} />);
        await settle();

        rerender(
            <Lightbox
                {...props}
                isOpen={false}
            />
        );
        await advance(FRAME * 4);
        rerender(
            <Lightbox
                {...props}
                currentIndex={3}
            />
        );
        await settle();

        expect(screen.getAllByTestId('lightbox-container')).toHaveLength(1);
        expect(shownImage()).toBe('Image 4');
        expect(containerAppearance().opacity).toBe(1);
    });

    test('can swap the images while open, as a filter would', async () => {
        const props = lightboxProps({ currentIndex: 1 });
        const { rerender } = render(<Lightbox {...props} />);
        await settle();

        rerender(
            <Lightbox
                {...props}
                images={props.images.map(({ src }, index) => ({
                    alt: `Filtered ${index + 1}`,
                    src: src.replace('image', 'filtered'),
                }))}
            />
        );
        await settle();

        expect(shownImage()).toBe('Filtered 2');
        expect(screen.getByAltText('Filtered 2')).toHaveAttribute('src', 'filtered-2.jpg');
    });
});

describe('at the last image, as a looping gallery sees it', () => {
    // Today → still asks for the next image while swipes and the wheel don't,
    // so a parent can loop from the keyboard but not from a gesture
    test('→ still calls onNext', () => {
        const props = lightboxProps({ currentIndex: 4 });
        render(<Lightbox {...props} />);

        pressKey('ArrowRight');

        expect(props.onNext).toHaveBeenCalledTimes(1);
    });

    test('a swipe or a quick wheel scroll does not call onNext', async () => {
        const props = lightboxProps({ currentIndex: 4 });
        render(<Lightbox {...props} />);
        await settle();

        await touchscreen.swipe(pageOf(5), SHORT_LEFT);
        wheel(pageOf(5), { deltaY: -200 });
        await advance(FRAME);
        wheel(pageOf(5), { deltaY: -200 });
        await settle();

        expect(props.onNext).not.toHaveBeenCalled();
    });
});

test('holding an arrow key pages once, when the key is released', () => {
    const props = lightboxProps({ currentIndex: 2 });
    render(<Lightbox {...props} />);

    for (let repeat = 0; repeat < 5; repeat += 1) {
        fireEvent.keyDown(document, { key: 'ArrowRight', repeat: repeat > 0 });
    }
    expect(props.onNext).not.toHaveBeenCalled();
    fireEvent.keyUp(document, { key: 'ArrowRight' });

    expect(props.onNext).toHaveBeenCalledTimes(1);
});

describe('more than one lightbox on a page', () => {
    test.fails('a key press pages at most one of two inline carousels (#65)', () => {
        const firstNext = vi.fn();
        const secondNext = vi.fn();
        const first = lightboxProps({ inline: true, onNext: firstNext });
        const second = lightboxProps({ inline: true, onNext: secondNext });
        render(
            <>
                <Lightbox {...first} />
                <Lightbox {...second} />
            </>
        );

        pressKey('ArrowRight');

        expect(firstNext.mock.calls.length + secondNext.mock.calls.length).toBeLessThanOrEqual(1);
    });

    test.fails('a key press pages only the open modal, not an inline carousel behind it (#65)', () => {
        const carousel = lightboxProps({ inline: true });
        const modal = lightboxProps();
        render(
            <>
                <Lightbox {...carousel} />
                <Lightbox {...modal} />
            </>
        );

        pressKey('ArrowRight');

        expect(modal.onNext).toHaveBeenCalledTimes(1);
        expect(carousel.onNext).not.toHaveBeenCalled();
    });
});

test.fails('opens without animating when the user prefers reduced motion', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
        addEventListener: () => undefined,
        addListener: () => undefined,
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        removeEventListener: () => undefined,
        removeListener: () => undefined,
    }));
    const props = lightboxProps();
    const { rerender } = render(
        <Lightbox
            {...props}
            isOpen={false}
        />
    );

    rerender(<Lightbox {...props} />);
    await advance(FRAME);

    vi.unstubAllGlobals();
    expect(containerAppearance().opacity).toBe(1);
});

describe('a gallery with one image', () => {
    const oneImage = (overrides = {}) => {
        const props = lightboxProps(overrides);
        return { ...props, images: props.images.slice(0, 1) };
    };

    test('tells both arrow buttons there is nowhere to go', () => {
        const renderNextButton = vi.fn(() => null);
        const renderPrevButton = vi.fn(() => null);

        render(<Lightbox {...oneImage({ renderNextButton, renderPrevButton })} />);

        expect(renderNextButton).toHaveBeenLastCalledWith({ canNext: false });
        expect(renderPrevButton).toHaveBeenLastCalledWith({ canPrev: false });
    });

    test('swipes in either direction spring back without paging', async () => {
        const props = oneImage();
        render(<Lightbox {...props} />);
        await settle();

        await touchscreen.swipe(image(1), SHORT_LEFT);
        await touchscreen.swipe(image(1), [
            [400, 300],
            [440, 300],
        ]);
        await settle();

        expect(props.onNext).not.toHaveBeenCalled();
        expect(props.onPrev).not.toHaveBeenCalled();
        expect(shownImage()).toBe('Image 1');
    });
});
