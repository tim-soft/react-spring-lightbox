import { render, screen, within } from '@testing-library/react';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import Lightbox from '../index';
import { mouse, pressKey, touchscreen, wheel } from './devices';
import {
    BACKDROP,
    CENTER,
    FRAME,
    Gallery,
    advance,
    containerAppearance,
    image,
    imageTransform,
    lightboxContainer,
    lightboxProps,
    mockLayout,
    pageOf,
    settle,
    shownImage,
} from './helpers';

const queryContainer = () => screen.queryByTestId('lightbox-container');

beforeEach(() => {
    mockLayout();
});

describe('opening', () => {
    test('renders nothing while closed', () => {
        render(<Lightbox {...lightboxProps({ isOpen: false })} />);

        expect(queryContainer()).not.toBeInTheDocument();
    });

    test('opens on the image at currentIndex', async () => {
        render(<Lightbox {...lightboxProps({ currentIndex: 3 })} />);
        await settle();

        expect(shownImage()).toBe('Image 4');
    });

    test('fades and grows into view', async () => {
        const props = lightboxProps();
        const { rerender } = render(
            <Lightbox
                {...props}
                isOpen={false}
            />
        );

        rerender(<Lightbox {...props} />);
        expect(containerAppearance()).toEqual({ opacity: 0, scale: 0.75 });

        await advance(FRAME * 5);
        const midway = containerAppearance();
        expect(midway.opacity).toBeGreaterThan(0);
        expect(midway.opacity).toBeLessThan(1);
        expect(midway.scale).toBeGreaterThan(0.75);
        expect(midway.scale).toBeLessThan(1);

        await settle();
        expect(containerAppearance()).toEqual({ opacity: 1, scale: 1 });
    });

    test('animates with pageTransitionConfig', async () => {
        render(
            <Lightbox
                {...lightboxProps({
                    pageTransitionConfig: {
                        config: { duration: 1000 },
                        enter: { opacity: 0.5 },
                    },
                })}
            />
        );

        // A duration-based spring eases linearly, so halfway there by 500ms
        await advance(500);
        expect(containerAppearance().opacity).toBeCloseTo(0.25, 1);

        await advance(600);
        expect(containerAppearance().opacity).toBe(0.5);
    });

    test('covers the whole viewport', () => {
        render(<Lightbox {...lightboxProps()} />);

        expect(lightboxContainer()).toHaveStyle({
            bottom: '0px',
            left: '0px',
            position: 'fixed',
            right: '0px',
            top: '0px',
        });
    });

    test('renders into its own container at the end of <body>', () => {
        render(<Lightbox {...lightboxProps()} />);

        const portal = document.body.lastElementChild;
        expect(portal).toHaveClass('lightbox-portal');
        expect(portal).toContainElement(lightboxContainer());
    });

    test('renders nothing on the server', () => {
        expect(renderToString(<Lightbox {...lightboxProps()} />)).toBe('');
    });
});

describe('closing', () => {
    test('fades and shrinks away, then unmounts, when isOpen turns false', async () => {
        const props = lightboxProps();
        const { rerender } = render(<Lightbox {...props} />);
        await settle();

        rerender(
            <Lightbox
                {...props}
                isOpen={false}
            />
        );
        await advance(FRAME * 5);
        const midway = containerAppearance();
        expect(midway.opacity).toBeGreaterThan(0);
        expect(midway.opacity).toBeLessThan(1);
        expect(midway.scale).toBeGreaterThan(0.75);
        expect(midway.scale).toBeLessThan(1);

        await settle();
        expect(queryContainer()).not.toBeInTheDocument();
    });

    test('Esc asks to close', () => {
        const props = lightboxProps();
        render(<Lightbox {...props} />);

        pressKey('Escape');

        expect(props.onClose).toHaveBeenCalledTimes(1);
    });

    test.each([
        ['clicking', mouse.click],
        ['tapping', touchscreen.tap],
    ])('%s the backdrop around the image asks to close', async (_, press) => {
        const props = lightboxProps();
        render(<Lightbox {...props} />);
        await settle();

        press(pageOf(1), BACKDROP);

        expect(props.onClose).toHaveBeenCalledTimes(1);
    });

    test('the close button in a custom header closes it', async () => {
        render(<Gallery />);
        await settle();

        mouse.click(screen.getByRole('button', { name: 'Close' }), CENTER);
        await settle();

        expect(queryContainer()).not.toBeInTheDocument();
    });

    test('works without an onClose callback', async () => {
        render(<Lightbox {...lightboxProps({ onClose: undefined })} />);
        await settle();

        expect(() => {
            pressKey('Escape');
            mouse.click(pageOf(1), BACKDROP);
        }).not.toThrow();
        expect(queryContainer()).toBeInTheDocument();
    });

    test('removes its container from <body> when unmounted', () => {
        const { unmount } = render(<Lightbox {...lightboxProps()} />);

        unmount();

        expect(document.querySelector('.lightbox-portal')).toBeNull();
    });
});

describe('staying open', () => {
    test.each([
        ['clicked', mouse.click],
        ['tapped', touchscreen.tap],
    ])('when the image is %s', async (_, press) => {
        const props = lightboxProps();
        render(<Lightbox {...props} />);
        await settle();

        press(image(1), CENTER);
        await settle();

        expect(props.onClose).not.toHaveBeenCalled();
    });

    test('when the image overlay is clicked, which still gets the click', async () => {
        const onShare = vi.fn();
        const props = lightboxProps({
            renderImageOverlay: () => (
                <button
                    onClick={onShare}
                    type="button"
                >
                    Share
                </button>
            ),
        });
        render(<Lightbox {...props} />);
        await settle();

        mouse.click(within(pageOf(1)).getByRole('button', { name: 'Share' }), CENTER);

        expect(onShare).toHaveBeenCalledTimes(1);
        expect(props.onClose).not.toHaveBeenCalled();
    });

    test('when the backdrop beside a neighbouring image is clicked', async () => {
        const props = lightboxProps();
        render(<Lightbox {...props} />);
        await settle();

        mouse.click(pageOf(2), BACKDROP);

        expect(props.onClose).not.toHaveBeenCalled();
    });

    test('when the backdrop is clicked while the image is zoomed in', async () => {
        const props = lightboxProps();
        render(<Lightbox {...props} />);
        await mouse.doubleClick(image(1), CENTER);
        await settle();

        mouse.click(pageOf(1), BACKDROP);

        expect(props.onClose).not.toHaveBeenCalled();
    });

    test('after a drag across the backdrop, though the browser clicks at the end', async () => {
        const props = lightboxProps({ currentIndex: 2 });
        render(<Lightbox {...props} />);
        await settle();

        await mouse.drag(
            pageOf(3),
            [
                [300, 300],
                [350, 300],
            ],
            100
        );

        expect(props.onClose).not.toHaveBeenCalled();
        expect(props.onPrev).not.toHaveBeenCalled();
    });
});

describe('the page behind it', () => {
    test('does not scroll with the wheel', () => {
        render(<Lightbox {...lightboxProps()} />);

        expect(wheel(lightboxContainer(), { deltaY: 100 })).toBe(false);
    });

    test.each(['ArrowUp', 'ArrowDown', 'End', 'Home', 'PageUp', 'PageDown'])('does not scroll with %s', (key) => {
        render(<Lightbox {...lightboxProps()} />);

        expect(pressKey(key)).toBe(false);
    });

    test('scrolls with the keyboard again once closed', () => {
        render(<Lightbox {...lightboxProps({ isOpen: false })} />);

        expect(pressKey('ArrowDown')).toBe(true);
    });

    test('still gets keys that do not scroll', () => {
        render(<Lightbox {...lightboxProps()} />);

        expect(pressKey('a')).toBe(true);
    });

    test.fails('lets a text field inside the lightbox move its cursor with Home and End (#65)', () => {
        render(
            <Lightbox
                {...lightboxProps({
                    renderFooter: () => <input aria-label="Caption" />,
                })}
            />
        );
        const caption = screen.getByRole('textbox', { name: 'Caption' });

        expect(pressKey('Home', caption)).toBe(true);
        expect(pressKey('End', caption)).toBe(true);
    });
});

test('reopens on the new currentIndex at full size', async () => {
    const props = lightboxProps();
    const { rerender } = render(<Lightbox {...props} />);
    await mouse.doubleClick(image(1), CENTER);
    await settle();

    rerender(
        <Lightbox
            {...props}
            isOpen={false}
        />
    );
    await settle();
    rerender(
        <Lightbox
            {...props}
            currentIndex={3}
        />
    );
    await settle();

    expect(shownImage()).toBe('Image 4');
    expect(imageTransform(image(1)).scale).toBe(1);
});
