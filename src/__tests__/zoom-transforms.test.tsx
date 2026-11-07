import { render } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, test } from 'vitest';

import type { Point } from './helpers';

import Lightbox from '../index';
import { emulateDesktopSafari, mouse, pressMouse, safariGesture, touch, trackpad } from './devices';
import { CENTER, FRAME, advance, image, imageTransform, lightboxProps, mockLayout, settle } from './helpers';

// These tests pin, step by step, how each gesture changes the image's scale
// and translate offsets, so that upgrading the gesture library can't change
// zooming unnoticed. The model below writes today's math down. Between steps
// the fingers or cursor hold still until the springs settle, which keeps the
// expected values independent of animation timing.

type Transform = { scale: number; x: number; y: number };

const AT_REST: Transform = { scale: 1, x: 0, y: 0 };

/**
 * Zooms to `scale` around a point on screen, keeping that point in place.
 * The mocked image box is centered at CENTER before its transform.
 */
const zoomAround = (from: Transform, scale: number, [pointX, pointY]: Point): Transform => {
    const imageX = (pointX - CENTER[0] - from.x) / from.scale;
    const imageY = (pointY - CENTER[1] - from.y) / from.scale;
    return {
        scale,
        x: from.x - imageX * (scale - from.scale),
        y: from.y - imageY * (scale - from.scale),
    };
};

/**
 * One pinch step adds `amount` to the scale around `origin`. Past 3x the
 * scale stops at 3 and the offsets stay put. Below 1x the image springs back
 * to rest.
 */
const pinchStep = (from: Transform, amount: number, origin: Point): Transform => {
    const scale = from.scale + amount;
    if (scale < 1) {
        return AT_REST;
    }
    if (scale > 3) {
        return { ...from, scale: 3 };
    }
    return zoomAround(from, scale, origin);
};

/** ctrl + wheel adds 7/1000 of each tick's deltaY, zooming in when it's negative */
const wheelAmount = (deltaY: number) => (-deltaY * 7) / 1000;

/** Fingers add 1/250 of how far their distance has changed since the pinch began */
const fingerAmount = (fingers: [Point, Point], startDistance: number) =>
    (Math.hypot(fingers[1][0] - fingers[0][0], fingers[1][1] - fingers[0][1]) - startDistance) / 250;

/** Safari adds 260/250 of how far its gesture scale has moved from 1 */
const safariAmount = (gestureScale: number) => ((gestureScale - 1) * 260) / 250;

const midpoint = ([[ax, ay], [bx, by]]: [Point, Point]): Point => [(ax + bx) / 2, (ay + by) / 2];

const expectTransform = (expected: Transform) => {
    const actual = imageTransform(image(1));
    expect(actual.scale).toBeCloseTo(expected.scale, 3);
    expect(actual.x).toBeCloseTo(expected.x, 2);
    expect(actual.y).toBeCloseTo(expected.y, 2);
};

const OFF_CENTER: Point = [612, 434];

beforeEach(() => {
    mockLayout();
});

describe('double click', () => {
    test('zooms to 2x around the clicked point, and back to rest', async () => {
        render(<Lightbox {...lightboxProps()} />);

        await mouse.doubleClick(image(1), OFF_CENTER);
        await settle();
        expectTransform(zoomAround(AT_REST, 2, OFF_CENTER));

        await mouse.doubleClick(image(1), OFF_CENTER);
        await settle();
        expectTransform(AT_REST);
    });

    test('zooms back to rest from any zoom and offset', async () => {
        render(<Lightbox {...lightboxProps()} />);
        await trackpad.pinch(image(1), { at: OFF_CENTER, deltaY: -50 });
        await settle();

        await mouse.doubleClick(image(1), CENTER);
        await settle();

        expectTransform(AT_REST);
    });
});

describe('ctrl + wheel', () => {
    test('each tick zooms around the cursor by 7/1000 of its deltaY', async () => {
        render(<Lightbox {...lightboxProps()} />);
        const ticks: [deltaY: number, at: Point][] = [
            [-50, OFF_CENTER],
            [-50, [700, 300]],
            [30, [400, 500]],
            [-100, CENTER],
        ];

        let expected = AT_REST;
        for (const [deltaY, at] of ticks) {
            await trackpad.pinch(image(1), { at, deltaY });
            await settle();
            expected = pinchStep(expected, wheelAmount(deltaY), at);
            expectTransform(expected);
        }
    });

    test('stops at 3x without moving the image, then springs back to rest below 1x', async () => {
        render(<Lightbox {...lightboxProps()} />);
        await trackpad.pinch(image(1), { at: OFF_CENTER, deltaY: -100 });
        await settle();
        const zoomed = pinchStep(AT_REST, wheelAmount(-100), OFF_CENTER);
        expectTransform(zoomed);

        await trackpad.pinch(image(1), { at: [700, 500], deltaY: -400 });
        await settle();
        expectTransform({ ...zoomed, scale: 3 });

        await trackpad.pinch(image(1), { at: CENTER, deltaY: 500 });
        await settle();
        expectTransform(AT_REST);
    });
});

describe('two fingers on the image', () => {
    const START: [Point, Point] = [
        [462, 384],
        [562, 384],
    ];
    const START_DISTANCE = 100;

    const pinchWith = async (moves: [Point, Point][]) => {
        render(<Lightbox {...lightboxProps()} />);
        // Only the image gets the fingers here; e2e/zooming.spec.ts pinches
        // in Chromium with the pointer events browsers also send
        const fingers = touch(image(1), START, { pointerEvents: false });
        await settle();

        let expected = AT_REST;
        for (const move of moves) {
            await fingers.moveTo(move);
            await settle();
            expected = pinchStep(expected, fingerAmount(move, START_DISTANCE), midpoint(move));
            expectTransform(expected);
        }
        return { expected, fingers };
    };

    test('each move zooms around the fingers by 1/250 of how far they have spread since the pinch began', async () => {
        const moves: [Point, Point][] = [
            [
                [452, 400],
                [572, 400],
            ],
            [
                [500, 430],
                [700, 430],
            ],
            [
                [540, 420],
                [660, 420],
            ],
        ];
        const { expected, fingers } = await pinchWith(moves);

        // Lifting the fingers repeats the last step once more (#17)
        fingers.lift();
        await settle();
        const last = moves[moves.length - 1];
        expectTransform(pinchStep(expected, fingerAmount(last, START_DISTANCE), midpoint(last)));
    });

    test('stops at 3x without moving the image', async () => {
        await pinchWith([
            [
                [525, 430],
                [675, 430],
            ],
            [
                [300, 450],
                [1000, 450],
            ],
        ]);
    });

    test('springs back to rest when pinched in past 1x', async () => {
        render(<Lightbox {...lightboxProps()} />);
        const fingers = touch(
            image(1),
            [
                [362, 384],
                [662, 384],
            ],
            { pointerEvents: false }
        );

        await fingers.moveTo([
            [462, 384],
            [562, 384],
        ]);
        await settle();

        expectTransform(AT_REST);
    });
});

describe('trackpad pinch in desktop Safari', () => {
    test('each gesture change zooms around the cursor by 260/250 of its scale above 1', async () => {
        emulateDesktopSafari();
        render(<Lightbox {...lightboxProps()} />);
        safariGesture(image(1), 'gesturestart', OFF_CENTER, 1);
        await settle();

        let expected = AT_REST;
        for (const gestureScale of [1.1, 1.3, 1.2]) {
            safariGesture(image(1), 'gesturechange', OFF_CENTER, gestureScale);
            await settle();
            expected = pinchStep(expected, safariAmount(gestureScale), OFF_CENTER);
            expectTransform(expected);
        }

        // Ending the gesture repeats the last step once more, as lifting
        // fingers does (#17)
        safariGesture(image(1), 'gestureend', OFF_CENTER, 1.2);
        await settle();
        expectTransform(pinchStep(expected, safariAmount(1.2), OFF_CENTER));
    });
});

describe('panning a zoomed-in image', () => {
    test('moves it by the pointer movement, less the 3px drag threshold on the side the drag first crossed', async () => {
        render(<Lightbox {...lightboxProps()} />);
        await mouse.doubleClick(image(1), CENTER);
        await settle();
        const button = pressMouse(image(1), [500, 400]);

        // The first move past the threshold only marks where the pan starts
        await button.moveTo([510, 410], 100);
        await settle();
        expectTransform({ scale: 2, x: 0, y: 0 });

        await button.moveTo([560, 430], 100);
        await settle();
        expectTransform({ scale: 2, x: 60 - 3, y: 30 - 3 });

        await button.moveTo([440, 380], 100);
        await settle();
        expectTransform({ scale: 2, x: -60 - 3, y: -20 - 3 });

        button.release();
        await settle();
        expectTransform({ scale: 2, x: -63, y: -23 });

        // Zooming the panned image keeps the cursor's point in place
        await trackpad.pinch(image(1), { at: OFF_CENTER, deltaY: -50 });
        await settle();
        expectTransform(pinchStep({ scale: 2, x: -63, y: -23 }, wheelAmount(-50), OFF_CENTER));
    });
});

describe('at 60fps, frame by frame', () => {
    /** The image's transform as `scale x y`, rounded for a readable snapshot */
    const frame = () => {
        const { scale, x, y } = imageTransform(image(1));
        return `${scale.toFixed(3)} ${x.toFixed(1)} ${y.toFixed(1)}`;
    };

    test('a two-finger pinch that spreads and drifts', async () => {
        render(<Lightbox {...lightboxProps()} />);
        const fingers = touch(
            image(1),
            [
                [462, 384],
                [562, 384],
            ],
            { pointerEvents: false }
        );

        const frames: string[] = [];
        for (let step = 1; step <= 8; step += 1) {
            await fingers.moveTo([
                [462 - step * 10, 384 + step * 3],
                [562 + step * 10, 384 + step * 3],
            ]);
            frames.push(frame());
        }
        fingers.lift();
        await settle();
        frames.push(frame());

        expect(frames).toMatchInlineSnapshot(`
          [
            "1.000 0.0 0.0",
            "1.002 0.0 -0.0",
            "1.007 0.0 -0.0",
            "1.018 0.0 -0.1",
            "1.035 0.0 -0.3",
            "1.059 0.0 -0.5",
            "1.091 0.0 -1.0",
            "1.130 0.0 -1.6",
            "1.770 0.0 -16.2",
          ]
        `);
    });

    test('a two-finger pinch in past 1x, springing back', async () => {
        render(<Lightbox {...lightboxProps()} />);
        const fingers = touch(
            image(1),
            [
                [312, 384],
                [712, 384],
            ],
            { pointerEvents: false }
        );

        const frames: string[] = [];
        for (let step = 1; step <= 3; step += 1) {
            await fingers.moveTo([
                [312 + step * 50, 384],
                [712 - step * 50, 384],
            ]);
            frames.push(frame());
        }
        for (let wait = 0; wait < 4; wait += 1) {
            await advance(FRAME);
            frames.push(frame());
        }
        fingers.lift();
        await settle();
        frames.push(frame());

        expect(frames).toMatchInlineSnapshot(`
          [
            "1.000 0.0 0.0",
            "0.992 0.0 0.0",
            "0.970 0.0 0.0",
            "0.940 0.0 0.0",
            "0.914 0.0 0.0",
            "0.900 0.0 0.0",
            "0.894 0.0 0.0",
            "1.000 0.0 0.0",
          ]
        `);
    });

    test('a trackpad pinch as ctrl + wheel ticks', async () => {
        render(<Lightbox {...lightboxProps()} />);

        const frames: string[] = [];
        for (let tick = 0; tick < 10; tick += 1) {
            await trackpad.pinch(image(1), { at: [650, 450], deltaY: -8 });
            frames.push(frame());
        }
        await settle();
        frames.push(frame());

        expect(frames).toMatchInlineSnapshot(`
          [
            "1.001 -0.2 -0.1",
            "1.005 -0.7 -0.3",
            "1.013 -1.8 -0.9",
            "1.025 -3.4 -1.6",
            "1.042 -5.8 -2.8",
            "1.064 -8.8 -4.2",
            "1.091 -12.6 -6.0",
            "1.124 -17.1 -8.2",
            "1.162 -22.3 -10.7",
            "1.206 -28.4 -13.6",
            "1.722 -99.6 -47.6",
          ]
        `);
    });
});
