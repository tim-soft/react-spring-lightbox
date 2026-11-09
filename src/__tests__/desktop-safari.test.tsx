import { render } from '@testing-library/react';
import React from 'react';
import { beforeEach, expect, test, vi } from 'vitest';

import type { Point } from './helpers';

import Lightbox from '../index';
import { safariGesture, safariPinch, wheel } from './devices';
import { CENTER, image, imageTransform, lightboxProps, mockLayout, settle } from './helpers';

// Desktop Safari has pointer events but no touch events, and sends a trackpad
// pinch as WebKit gesture events. @use-gesture checks for both once, when it
// loads, so this runs before the imports above load the lightbox.
vi.hoisted(() => {
    let owner: object = window;
    while (!Object.prototype.hasOwnProperty.call(owner, 'ontouchstart')) {
        owner = Object.getPrototypeOf(owner);
    }
    delete (owner as { ontouchstart?: unknown }).ontouchstart;
    Object.assign(globalThis, { GestureEvent: class GestureEvent extends UIEvent {} });
});

// (612, 434) sits (100, 50) from the image center
const OFF_CENTER: Point = [612, 434];

/** The image is zoomed to `scale` with the point under OFF_CENTER still under it */
const expectZoomedAtOffCenter = (scale: number) => {
    const actual = imageTransform(image(1));
    expect(actual.scale).toBeCloseTo(scale, 3);
    expect(actual.x).toBeCloseTo(-100 * (scale - 1), 2);
    expect(actual.y).toBeCloseTo(-50 * (scale - 1), 2);
};

beforeEach(() => {
    mockLayout();
});

test('each gesture change zooms around the cursor by 260/250 of its scale above 1', async () => {
    render(<Lightbox {...lightboxProps()} />);
    safariGesture(image(1), 'gesturestart', OFF_CENTER, 1);
    await settle();

    let scale = 1;
    for (const gestureScale of [1.1, 1.3, 1.2]) {
        safariGesture(image(1), 'gesturechange', OFF_CENTER, gestureScale);
        await settle();
        scale += ((gestureScale - 1) * 260) / 250;
        expectZoomedAtOffCenter(scale);
    }

    // Ending the gesture keeps the zoom (#17)
    safariGesture(image(1), 'gestureend', OFF_CENTER, 1.2);
    await settle();
    expectZoomedAtOffCenter(scale);
});

test('a trackpad pinch springs back to full size when zoomed out past 1x', async () => {
    render(<Lightbox {...lightboxProps()} />);

    await safariPinch(image(1), { at: CENTER, scales: [0.8, 0.5] });
    await settle();

    expect(image(1)).toHaveStyle({ transform: 'translate(0px, 0px) scale(1)' });
});

test('ctrl + wheel zooms in toward the cursor, as in other browsers', async () => {
    render(<Lightbox {...lightboxProps()} />);

    wheel(image(1), { at: OFF_CENTER, ctrlKey: true, deltaY: -50 });
    await settle();

    expectZoomedAtOffCenter(1 + (50 * 7) / 1000);
});
