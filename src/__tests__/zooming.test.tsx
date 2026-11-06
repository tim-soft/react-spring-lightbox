import React from 'react';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import Lightbox from '../index';
import {
    emulateDesktopSafari,
    emulateTouchOnlyBrowser,
    mouse,
    pressKey,
    safariPinch,
    touch,
    touchscreen,
    trackpad,
    wheel,
} from './devices';
import {
    BACKDROP,
    CENTER,
    FRAME,
    Gallery,
    advance,
    image,
    imageTransform,
    lightboxProps,
    mockLayout,
    pageOf,
    settle,
    shownImage,
} from './helpers';
import type { Point } from './helpers';

// (612, 434) sits (100, 50) from the image center, so keeping it in place
// at 2x moves the image by (-100, -50)
const OFF_CENTER: Point = [612, 434];
const ZOOMED_AT_OFF_CENTER = 'translate(-100px, -50px) scale(2)';
const ZOOMED_AT_CENTER = 'translate(0px, 0px) scale(2)';
const AT_REST = 'translate(0px, 0px) scale(1)';

const FINGERS_CLOSE: [Point, Point] = [
    [462, 384],
    [562, 384],
];
const FINGERS_APART: [Point, Point] = [
    [412, 384],
    [612, 384],
];
const FINGERS_WIDE: [Point, Point] = [
    [312, 384],
    [712, 384],
];

/** True when the point `offset` from the image center stays put on screen */
const keepsInPlace = (element: HTMLElement, [offsetX, offsetY]: Point) => {
    const { scale, x, y } = imageTransform(element);
    expect(scale).toBeGreaterThan(1);
    expect(x).toBeCloseTo(-offsetX * (scale - 1));
    expect(y).toBeCloseTo(-offsetY * (scale - 1));
};

beforeEach(() => {
    mockLayout();
});

describe('with a mouse', () => {
    test('a double click zooms in 2x, keeping the clicked point under the cursor', async () => {
        render(<Lightbox {...lightboxProps()} />);

        await mouse.doubleClick(image(1), OFF_CENTER);
        await settle();

        expect(image(1).style.transform).toBe(
            // jsdom drops a 0px y from translate()
            ZOOMED_AT_OFF_CENTER,
        );
    });

    test('the zoom animates', async () => {
        render(<Lightbox {...lightboxProps()} />);

        await mouse.doubleClick(image(1), CENTER);
        // The double click latency, then a few frames
        await advance(100 + FRAME * 5);

        const { scale } = imageTransform(image(1));
        expect(scale).toBeGreaterThan(1);
        expect(scale).toBeLessThan(2);
    });

    test('another double click zooms back out', async () => {
        render(<Lightbox {...lightboxProps()} />);
        await mouse.doubleClick(image(1), OFF_CENTER);
        await settle();

        await mouse.doubleClick(image(1), OFF_CENTER);
        await settle();

        expect(image(1)).toHaveStyle({ transform: AT_REST });
    });

    test('a single click does not zoom', async () => {
        render(<Lightbox {...lightboxProps()} />);

        mouse.click(image(1), CENTER);
        await settle();

        expect(image(1)).toHaveStyle({ transform: AT_REST });
    });

    test('with singleClickToZoom, one click zooms in and another zooms out', async () => {
        render(<Lightbox {...lightboxProps({ singleClickToZoom: true })} />);

        mouse.click(image(1), CENTER);
        // No waiting to see whether a second click follows
        await advance(FRAME * 2);
        expect(imageTransform(image(1)).scale).toBeGreaterThan(1);
        await settle();
        expect(image(1)).toHaveStyle({ transform: ZOOMED_AT_CENTER });

        mouse.click(image(1), CENTER);
        await settle();
        expect(image(1)).toHaveStyle({ transform: AT_REST });
    });

    test('clicks are ignored while a drag that did not page settles, then work again', async () => {
        render(<Lightbox {...lightboxProps({ currentIndex: 2 })} />);
        await mouse.drag(
            pageOf(3),
            [
                [600, 300],
                [550, 300],
            ],
            100,
        );

        await mouse.doubleClick(image(3), CENTER);
        await settle();
        expect(image(3)).toHaveStyle({ transform: AT_REST });

        await mouse.doubleClick(image(3), CENTER);
        await settle();
        expect(image(3)).toHaveStyle({ transform: ZOOMED_AT_CENTER });
    });

    test('clicks are ignored while a wheel scroll pages, then work again', async () => {
        render(<Lightbox {...lightboxProps({ currentIndex: 2 })} />);
        await trackpad.scroll(pageOf(3), { deltaY: 200, ticks: 2 });

        await mouse.doubleClick(image(3), CENTER);
        await advance(200);
        expect(image(3)).toHaveStyle({ transform: AT_REST });

        await mouse.doubleClick(image(3), CENTER);
        await settle();
        expect(image(3)).toHaveStyle({ transform: ZOOMED_AT_CENTER });
    });
});

describe('with a touchscreen', () => {
    test('a double tap zooms in 2x, keeping the tapped point in place', async () => {
        render(<Lightbox {...lightboxProps()} />);

        await touchscreen.doubleTap(image(1), OFF_CENTER);
        await settle();

        expect(image(1)).toHaveStyle({ transform: ZOOMED_AT_OFF_CENTER });
    });

    test('another double tap zooms back out', async () => {
        render(<Lightbox {...lightboxProps()} />);
        await touchscreen.doubleTap(image(1), OFF_CENTER);
        await settle();

        await touchscreen.doubleTap(image(1), OFF_CENTER);
        await settle();

        expect(image(1)).toHaveStyle({ transform: AT_REST });
    });

    test('with singleClickToZoom, one tap zooms in', async () => {
        render(<Lightbox {...lightboxProps({ singleClickToZoom: true })} />);

        touchscreen.tap(image(1), CENTER);
        await advance(FRAME * 2);
        expect(imageTransform(image(1)).scale).toBeGreaterThan(1);
        await settle();

        expect(image(1)).toHaveStyle({ transform: ZOOMED_AT_CENTER });
    });

    test('a pinch is ignored while one finger is already paging', async () => {
        render(<Lightbox {...lightboxProps({ currentIndex: 2 })} />);
        const fingers = touch(image(3), [[600, 300]]);
        await fingers.moveTo([[550, 300]], 100);

        fingers.add([700, 300]);
        await fingers.moveTo([
            [500, 300],
            [800, 300],
        ]);
        fingers.lift();
        await settle();

        expect(image(3)).toHaveStyle({ transform: AT_REST });
    });

    // The pinch's first frame leaves the image at 1x, so onRest unlocks the
    // pager. The pager then starts dragging with the first finger, and onPinch
    // ignores the rest of the pinch while the pager drags.
    test.fails(
        'spreading two fingers zooms in, on browsers that send pointer events with touches (current mobile browsers)',
        async () => {
            render(<Lightbox {...lightboxProps()} />);
            await settle();

            await touchscreen.pinch(image(1), FINGERS_CLOSE, FINGERS_WIDE);
            await settle();

            expect(imageTransform(image(1)).scale).toBeGreaterThan(1);
        },
    );

    test.fails(
        'spreading two fingers zooms all the way in, on browsers that only send touch events (iOS 12 and older)',
        async () => {
            emulateTouchOnlyBrowser();
            render(<Lightbox {...lightboxProps()} />);
            await settle();

            await touchscreen.pinch(image(1), FINGERS_CLOSE, [
                [12, 384],
                [1012, 384],
            ]);
            await settle();

            expect(imageTransform(image(1)).scale).toBe(3);
        },
    );
});

// The pager takes over pinches today (see the expected failures above), so
// these keep the fingers' events away from it to cover the image's handling
describe('pinch handling on the image', () => {
    const fingersOn = (target: Element, points: Point[]) =>
        touch(target, points, { pointerEvents: false });
    const pinch = (target: Element, from: [Point, Point], to: [Point, Point]) =>
        touchscreen.pinch(target, from, to, { pointerEvents: false });

    test('spreading two fingers zooms in around them', async () => {
        render(<Lightbox {...lightboxProps()} />);
        const fingers = fingersOn(image(1), FINGERS_CLOSE);

        await fingers.moveTo(FINGERS_APART);
        await settle();

        // The fingers spread evenly around the image center, which stays put
        keepsInPlace(image(1), [0, 0]);
    });

    test('pinching two fingers together past 1x springs back to full size', async () => {
        render(<Lightbox {...lightboxProps()} />);
        const fingers = fingersOn(image(1), FINGERS_WIDE);

        await fingers.moveTo(FINGERS_CLOSE);
        await settle();

        expect(image(1)).toHaveStyle({ transform: AT_REST });
    });

    test('stops zooming in at 3x', async () => {
        render(<Lightbox {...lightboxProps()} />);

        await pinch(image(1), FINGERS_CLOSE, [
            [12, 384],
            [1012, 384],
        ]);
        await settle();

        expect(imageTransform(image(1)).scale).toBe(3);
    });

    test('stays zoomed in after the fingers lift, holding the pager still', async () => {
        render(<Gallery initialIndex={2} />);
        await settle();

        await pinch(image(3), FINGERS_CLOSE, FINGERS_APART);
        await settle();
        expect(imageTransform(image(3)).scale).toBeGreaterThan(1);

        await touchscreen.swipe(pageOf(3), [
            [600, 300],
            [200, 300],
        ]);
        touchscreen.tap(pageOf(3), BACKDROP);
        await settle();
        expect(shownImage()).toBe('Image 3');
        expect(imageTransform(image(3)).scale).toBeGreaterThan(1);
    });

    test('a double tap after a pinch zooms back out', async () => {
        render(<Lightbox {...lightboxProps()} />);
        await pinch(image(1), FINGERS_CLOSE, FINGERS_APART);
        await settle();

        await touchscreen.doubleTap(image(1), CENTER);
        await settle();

        expect(image(1)).toHaveStyle({ transform: AT_REST });
    });

    test('the pager pages again once a pinch ends back at full size', async () => {
        render(<Gallery initialIndex={2} />);
        await settle();

        await pinch(image(3), FINGERS_WIDE, FINGERS_CLOSE);
        await settle();
        await touchscreen.swipe(image(3), [
            [600, 300],
            [560, 300],
        ]);
        await settle();

        expect(shownImage()).toBe('Image 4');
    });

    test.fails(
        'lifting the fingers keeps the zoom the pinch ended on (#17)',
        async () => {
            render(<Lightbox {...lightboxProps()} />);
            const fingers = fingersOn(image(1), FINGERS_CLOSE);
            await fingers.moveTo(FINGERS_APART);
            await settle();
            const pinched = imageTransform(image(1)).scale;

            fingers.lift();
            await settle();

            expect(imageTransform(image(1)).scale).toBe(pinched);
        },
    );
});

describe('with ctrl + wheel (a trackpad pinch in Chrome, Edge and Firefox)', () => {
    test('zooms in toward the cursor', async () => {
        render(<Lightbox {...lightboxProps()} />);

        await trackpad.pinch(image(1), { at: [712, 484], deltaY: -50 });
        await settle();

        keepsInPlace(image(1), [200, 100]);
    });

    test('stops zooming in at 3x', async () => {
        render(<Lightbox {...lightboxProps()} />);

        await trackpad.pinch(image(1), { deltaY: -500 });
        await settle();

        expect(imageTransform(image(1)).scale).toBe(3);
    });

    test('springs back to full size when zoomed out past 1x', async () => {
        render(<Lightbox {...lightboxProps()} />);

        await trackpad.pinch(image(1), { deltaY: 500 });
        await settle();

        expect(image(1)).toHaveStyle({ transform: AT_REST });
    });

    test('holds the pager still while the pinch is underway', async () => {
        const props = lightboxProps({ currentIndex: 2 });
        render(<Lightbox {...props} />);

        await trackpad.pinch(image(3), { deltaY: -50 });
        wheel(pageOf(3), { deltaY: -100 });
        await advance(FRAME);
        wheel(pageOf(3), { deltaY: -100 });
        await advance(FRAME);

        expect(props.onNext).not.toHaveBeenCalled();
    });
});

describe('with a trackpad pinch in desktop Safari', () => {
    test('zooms in toward the cursor', async () => {
        emulateDesktopSafari();
        render(<Lightbox {...lightboxProps()} />);

        await safariPinch(image(1), { at: [712, 484], scales: [1.2, 1.5] });
        await settle();

        keepsInPlace(image(1), [200, 100]);
    });

    test('springs back to full size when zoomed out past 1x', async () => {
        emulateDesktopSafari();
        render(<Lightbox {...lightboxProps()} />);

        await safariPinch(image(1), { at: CENTER, scales: [0.8, 0.5] });
        await settle();

        expect(image(1)).toHaveStyle({ transform: AT_REST });
    });
});

test('the zoom resets once the image is no longer current', async () => {
    render(<Gallery />);
    await settle();
    await mouse.doubleClick(image(1), OFF_CENTER);
    await settle();

    pressKey('ArrowRight');
    await settle();

    expect(image(1)).toHaveStyle({ transform: AT_REST });
});
