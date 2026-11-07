import { render } from '@testing-library/react';
import { createRequire } from 'node:module';
import React from 'react';
import { beforeAll, beforeEach, describe, expect, test } from 'vitest';

import type Lightbox from '../index';

import { mouse, pressKey, touchscreen } from './devices';
import { CENTER, image, imageTransform, lightboxProps, mockLayout, pageOf, settle, shownImage } from './helpers';

// People install dist/, not src/. These run a few flows against both built
// bundles, which `npm run build` (and `prepare`, on install) produces.

const require = createRequire(import.meta.url);

const missing = (file: string) => new Error(`dist/${file} is missing. Run \`npm run build\` first.`);

const loadCommonJs = (): typeof Lightbox => {
    let bundlePath: string;
    try {
        bundlePath = require.resolve('../../dist/index.cjs');
    } catch {
        throw missing('index.cjs');
    }
    // The bundle loads react-spring's CommonJS build, a separate copy from
    // the one setup.ts configures, so let fake timers drive its frames too
    require('@react-spring/web').Globals.assign({
        requestAnimationFrame: (callback: FrameRequestCallback) => requestAnimationFrame(callback),
    });
    return require(bundlePath);
};

const loadEsModule = async (): Promise<typeof Lightbox> => {
    // A computed path keeps tsc from needing dist/ to type-check the tests
    const bundlePath = '../../dist/index.mjs';
    try {
        return (await import(/* @vite-ignore */ bundlePath)).default;
    } catch {
        throw missing('index.mjs');
    }
};

describe.each([
    ['CommonJS', loadCommonJs],
    ['ES module', loadEsModule],
])('the %s bundle', (_format, load) => {
    let PublishedLightbox: typeof Lightbox;

    beforeAll(async () => {
        PublishedLightbox = await load();
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
});
