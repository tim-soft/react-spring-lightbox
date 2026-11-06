import React from 'react';
import { createRequire } from 'node:module';
import { render } from '@testing-library/react';
import { beforeAll, beforeEach, expect, test } from 'vitest';
import type Lightbox from '../index';
import { mouse, pressKey, touchscreen } from './devices';
import {
    CENTER,
    image,
    imageTransform,
    lightboxProps,
    mockLayout,
    pageOf,
    settle,
    shownImage,
} from './helpers';

// People install dist/, not src/. These run a few flows against the built
// bundle, which `yarn build` (and `prepare`, on install) produces.

const require = createRequire(import.meta.url);
let PublishedLightbox: typeof Lightbox;

beforeAll(() => {
    let bundlePath: string;
    try {
        bundlePath = require.resolve('../../dist/index.cjs.js');
    } catch {
        throw new Error(
            'dist/index.cjs.js is missing. Run `yarn build` first.',
        );
    }
    // The bundle loads react-spring's CommonJS build, a separate copy from
    // the one setup.ts configures, so let fake timers drive its frames too
    require('@react-spring/web').Globals.assign({
        requestAnimationFrame: (callback: FrameRequestCallback) =>
            requestAnimationFrame(callback),
    });
    PublishedLightbox = require(bundlePath);
});

beforeEach(() => {
    mockLayout();
});

test('opens on currentIndex and pages with the keyboard', async () => {
    const props = lightboxProps({ currentIndex: 2 });
    render(<PublishedLightbox {...props} />);
    await settle();

    pressKey('ArrowRight');

    expect(shownImage()).toBe('Image 3');
    expect(props.onNext).toHaveBeenCalledTimes(1);
});

test('pages with a swipe', async () => {
    const props = lightboxProps({ currentIndex: 2 });
    render(<PublishedLightbox {...props} />);
    await settle();

    await touchscreen.swipe(pageOf(3), [
        [600, 300],
        [560, 300],
    ]);

    expect(props.onNext).toHaveBeenCalledTimes(1);
});

test('zooms in on a double click', async () => {
    render(<PublishedLightbox {...lightboxProps()} />);
    await settle();

    await mouse.doubleClick(image(1), CENTER);
    await settle();

    expect(imageTransform(image(1)).scale).toBe(2);
});
