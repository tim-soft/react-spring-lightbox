import React from 'react';
import { render } from '@testing-library/react';
import { beforeEach, expect, test } from 'vitest';
import Lightbox from '../index';
import { mouse, pressMouse, pressPointer, touch, touchscreen } from './devices';
import {
    CENTER,
    FRAME,
    advance,
    image,
    imageTransform,
    lightboxProps,
    mockLayout,
    settle,
} from './helpers';

const ZOOMED_AT_CENTER = 'translate(0px, 0px) scale(2)';
const AT_REST = 'translate(0px, 0px) scale(1)';

let layout: ReturnType<typeof mockLayout>;

beforeEach(() => {
    layout = mockLayout();
});

const openZoomedIn = async () => {
    render(<Lightbox {...lightboxProps()} />);
    await mouse.doubleClick(image(1), CENTER);
    await settle();
    expect(image(1)).toHaveStyle({ transform: ZOOMED_AT_CENTER });
};

test('a mouse drag pans a zoomed-in image along with the pointer', async () => {
    await openZoomedIn();
    const button = pressMouse(image(1), [500, 400]);

    await button.moveTo([510, 410], 100);
    await button.moveTo([550, 450], 100);
    await settle();
    const before = imageTransform(image(1));
    await button.moveTo([600, 470], 100);
    await settle();
    const after = imageTransform(image(1));

    expect(after.scale).toBe(2);
    expect([after.x - before.x, after.y - before.y]).toEqual([50, 20]);
});

test('a finger pans a zoomed-in image along with it', async () => {
    render(<Lightbox {...lightboxProps()} />);
    await touchscreen.doubleTap(image(1), CENTER);
    await settle();
    const finger = touch(image(1), [[500, 400]]);

    await finger.moveTo([[510, 410]], 100);
    await finger.moveTo([[550, 450]], 100);
    await settle();
    const before = imageTransform(image(1));
    await finger.moveTo([[600, 470]], 100);
    await settle();
    const after = imageTransform(image(1));

    expect(after.scale).toBe(2);
    expect([after.x - before.x, after.y - before.y]).toEqual([50, 20]);
});

test('keeps the pan after letting go, ignoring the click the browser fires then', async () => {
    await openZoomedIn();

    await mouse.drag(
        image(1),
        [
            [500, 400],
            [550, 450],
            [600, 500],
        ],
        100,
    );
    await settle();

    const { scale, x, y } = imageTransform(image(1));
    expect(scale).toBe(2);
    expect(x).toBeGreaterThan(0);
    expect(y).toBeGreaterThan(0);
});

test('does not move an image at full size', async () => {
    render(<Lightbox {...lightboxProps()} />);

    await mouse.drag(image(1), [
        [500, 300],
        [500, 400],
        [500, 500],
    ]);
    await settle();

    expect(image(1)).toHaveStyle({ transform: AT_REST });
});

test('stops panning once a second finger touches down', async () => {
    render(<Lightbox {...lightboxProps()} />);
    await touchscreen.doubleTap(image(1), CENTER);
    await settle();
    const fingers = touch(image(1), [[500, 400]]);
    await fingers.moveTo([[510, 410]], 100);

    // Both fingers move the same way, so the distance between them, and the zoom, stay put
    fingers.add([600, 400]);
    await fingers.moveTo(
        [
            [550, 450],
            [640, 440],
        ],
        100,
    );
    await settle();

    expect(image(1)).toHaveStyle({ transform: ZOOMED_AT_CENTER });
});

test('stops panning while a pen also touches the image', async () => {
    render(<Lightbox {...lightboxProps()} />);
    await touchscreen.doubleTap(image(1), CENTER);
    await settle();
    const finger = touch(image(1), [[500, 400]]);
    pressPointer(image(1), [700, 300], { id: 2, pointerType: 'pen' });

    await finger.moveTo([[510, 410]], 100);
    await finger.moveTo([[550, 450]], 100);
    await finger.moveTo([[600, 500]], 100);
    await settle();

    expect(image(1)).toHaveStyle({ transform: ZOOMED_AT_CENTER });
});

test('a pen or mouse drag does not pan while two fingers pinch', async () => {
    await openZoomedIn();
    touch(
        image(1),
        [
            [462, 384],
            [562, 384],
        ],
        { pointerEvents: false },
    );

    await mouse.drag(image(1), [
        [500, 400],
        [550, 450],
        [600, 500],
    ]);
    await settle();

    expect(image(1)).toHaveStyle({ transform: ZOOMED_AT_CENTER });
});

test('stops panning once the image no longer covers the center of the window', async () => {
    await openZoomedIn();
    const button = pressMouse(image(1), [500, 400]);
    await button.moveTo([510, 400], 100);

    // Move the image's box so that, zoomed in, it sits right of center
    layout.image.left = 1000;
    await button.moveTo([400, 400], 100);
    await advance(FRAME);
    layout.image.left = 212;
    await button.moveTo([300, 400], 100);
    button.release();
    await settle();

    expect(image(1)).toHaveStyle({ transform: ZOOMED_AT_CENTER });
});

test('springs back to full size when panned out of view', async () => {
    await openZoomedIn();

    await mouse.drag(image(1), [
        [100, 400],
        [110, 400],
        [1000, 400],
    ]);
    await settle();

    expect(image(1)).toHaveStyle({ transform: AT_REST });
});

test('ignores taps for 100ms after a pan', async () => {
    render(<Lightbox {...lightboxProps({ singleClickToZoom: true })} />);
    touchscreen.tap(image(1), CENTER);
    await settle();
    await touchscreen.swipe(image(1), [
        [500, 400],
        [550, 450],
        [600, 500],
    ]);

    touchscreen.tap(image(1), [600, 500]);
    await settle();
    expect(imageTransform(image(1)).scale).toBe(2);

    touchscreen.tap(image(1), [600, 500]);
    await settle();
    expect(image(1)).toHaveStyle({ transform: AT_REST });
});
