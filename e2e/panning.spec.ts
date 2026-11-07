import type { Page } from '@playwright/test';

import type { Point } from './support';

import { calls, chromiumInput, expect, imageTransform, openHarness, pointIn, settle, test } from './support';

/** Moves the mouse from `from` by `delta` in four steps 100ms apart */
const slowMouseDrag = async (page: Page, [x, y]: Point, [dx, dy]: Point) => {
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let step = 1; step <= 4; step += 1) {
        await page.waitForTimeout(100);
        await page.mouse.move(x + (dx * step) / 4, y + (dy * step) / 4);
    }
    await page.mouse.up();
};

const boxOf = async (page: Page) => {
    const box = await page.getByAltText('Image 3').boundingBox();
    if (!box) throw new Error('Image 3 is not visible');
    return box;
};

test.describe('with a mouse', () => {
    test.skip(({ isMobile }) => isMobile, 'Mouse input');

    test('dragging a zoomed-in image pans it with the pointer, and the pan stays', async ({ page }) => {
        await openHarness(page, 'index=2');
        const center = await pointIn(page.getByAltText('Image 3'));
        await page.mouse.dblclick(...center);
        await settle(page);
        const before = await boxOf(page);

        await slowMouseDrag(page, center, [150, 80]);
        await settle(page);
        const after = await boxOf(page);

        expect(Math.abs(after.x - before.x - 150)).toBeLessThan(6);
        expect(Math.abs(after.y - before.y - 80)).toBeLessThan(6);
        expect((await imageTransform(page, 'Image 3')).scale).toBeCloseTo(2, 2);
    });

    test('dragging an image at full size up or down does not move it', async ({ page }) => {
        await openHarness(page, 'index=2');
        const before = await boxOf(page);

        await slowMouseDrag(page, await pointIn(page.getByAltText('Image 3')), [0, 150]);
        await settle(page);

        expect(await boxOf(page)).toEqual(before);
        expect(await calls(page)).toEqual({ onClose: 0, onNext: 0, onPrev: 0 });
    });

    test('panning a zoomed-in image out of view springs it back to full size', async ({ page }) => {
        await openHarness(page, 'index=2');
        const center = await pointIn(page.getByAltText('Image 3'));
        await page.mouse.dblclick(...center);
        await settle(page);

        await slowMouseDrag(page, [100, center[1]], [1000, 0]);
        await settle(page);

        expect((await imageTransform(page, 'Image 3')).scale).toBe(1);
    });
});

test.describe('with a finger', () => {
    test.skip(
        ({ browserName, isMobile }) => !isMobile || browserName !== 'chromium',
        'Touch input through the DevTools protocol'
    );

    test('dragging a zoomed-in image pans it with the finger', async ({ page }) => {
        await openHarness(page, 'index=2');
        const [x, y] = await pointIn(page.getByAltText('Image 3'));
        await page.touchscreen.tap(x, y);
        await page.waitForTimeout(80);
        await page.touchscreen.tap(x, y);
        await settle(page);
        const before = await boxOf(page);
        const { touch } = await chromiumInput(page);

        await touch.swipe(
            [
                [x, y],
                [x + 20, y + 15],
                [x + 40, y + 30],
                [x + 60, y + 45],
            ],
            100
        );
        await settle(page);
        const after = await boxOf(page);

        expect(Math.abs(after.x - before.x - 60)).toBeLessThan(6);
        expect(Math.abs(after.y - before.y - 45)).toBeLessThan(6);
    });
});
