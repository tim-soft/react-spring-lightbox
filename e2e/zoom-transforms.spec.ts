import type { Page } from '@playwright/test';

import type { Point } from './support';

import { chromiumInput, expect, imageTransform, openHarness, settle, test } from './support';

// The same zoom math as src/__tests__/zoom-transforms.test.tsx, checked in
// Chromium with real input and real layout, so that upgrading the gesture
// library can't change it unnoticed. Between steps the fingers or cursor hold
// still until the springs settle.

type Transform = { scale: number; x: number; y: number };

const AT_REST: Transform = { scale: 1, x: 0, y: 0 };

/** Zooms to `scale` around a point on screen, keeping that point in place */
const zoomAround = (center: Point, from: Transform, scale: number, [pointX, pointY]: Point): Transform => {
    const imageX = (pointX - center[0] - from.x) / from.scale;
    const imageY = (pointY - center[1] - from.y) / from.scale;
    return {
        scale,
        x: from.x - imageX * (scale - from.scale),
        y: from.y - imageY * (scale - from.scale),
    };
};

/** Adds `amount` to the scale around `origin`, stopping at 3x and springing back below 1x */
const pinchStep = (center: Point, from: Transform, amount: number, origin: Point): Transform => {
    const scale = from.scale + amount;
    if (scale < 1) return AT_REST;
    if (scale > 3) return { ...from, scale: 3 };
    return zoomAround(center, from, scale, origin);
};

const expectTransform = async (page: Page, expected: Transform) => {
    const actual = await imageTransform(page, 'Image 3');
    expect(actual.scale).toBeCloseTo(expected.scale, 2);
    expect(Math.abs(actual.x - expected.x)).toBeLessThan(1);
    expect(Math.abs(actual.y - expected.y)).toBeLessThan(1);
};

/** The center of Image 3 at rest, which the zoom math measures from */
const restingCenter = async (page: Page): Promise<Point> => {
    const box = await page.getByAltText('Image 3').boundingBox();
    if (!box) throw new Error('Image 3 is not visible');
    return [box.x + box.width / 2, box.y + box.height / 2];
};

test.describe('in desktop Chromium', () => {
    test.skip(
        ({ browserName, isMobile }) => isMobile || browserName !== 'chromium',
        'Input through the DevTools protocol'
    );

    test('each ctrl + wheel tick zooms around the cursor by 7/1000 of its deltaY', async ({ page }) => {
        await openHarness(page, 'index=2');
        const center = await restingCenter(page);
        const { wheel } = await chromiumInput(page);
        // Whole pixels, since the browser reports the cursor in whole pixels
        const near = (dx: number, dy: number): Point => [Math.round(center[0] + dx), Math.round(center[1] + dy)];
        const ticks: [deltaY: number, at: Point][] = [
            [-50, near(100, 50)],
            [-50, near(180, -80)],
            [30, near(-110, 110)],
            [-100, near(0, 0)],
        ];

        let expected = AT_REST;
        for (const [deltaY, at] of ticks) {
            await wheel(at, { ctrl: true, deltaY });
            await settle(page);
            expected = pinchStep(center, expected, (-deltaY * 7) / 1000, at);
            await expectTransform(page, expected);
        }
    });

    test('a pan moves the image by the pointer movement, less the 3px drag threshold', async ({ page }) => {
        await openHarness(page, 'index=2');
        const center = await restingCenter(page);
        await page.mouse.dblclick(...center);
        await settle(page);
        const { mouse } = await chromiumInput(page);

        await mouse.drag(
            [
                center,
                [center[0] + 10, center[1] + 10],
                [center[0] + 60, center[1] + 30],
                [center[0] - 60, center[1] - 20],
            ],
            100
        );
        await settle(page);

        await expectTransform(page, { scale: 2, x: -60 - 3, y: -20 - 3 });
    });
});

test.describe('with two fingers in mobile Chromium', () => {
    test.skip(
        ({ browserName, isMobile }) => !isMobile || browserName !== 'chromium',
        'Multi-touch through the DevTools protocol'
    );

    const around = ([x, y]: Point, spread: number): [Point, Point] => [
        [x - spread / 2, y],
        [x + spread / 2, y],
    ];

    test('each move zooms around the fingers by 1/250 of how far they have spread since the pinch began', async ({
        page,
    }) => {
        await openHarness(page, 'index=2');
        const center = await restingCenter(page);
        const { touch } = await chromiumInput(page);
        const start = around(center, 60);
        const moves: [Point, Point][] = [
            around(center, 100),
            around([center[0] + 20, center[1] + 10], 160),
            around([center[0] + 20, center[1] + 10], 120),
        ];

        await touch.down(start);
        let expected = AT_REST;
        for (const move of moves) {
            await touch.move(move);
            await settle(page);
            expected = pinchStep(center, expected, (move[1][0] - move[0][0] - 60) / 250, [
                (move[0][0] + move[1][0]) / 2,
                move[0][1],
            ]);
            await expectTransform(page, expected);
        }
    });

    test('fingers that rest before spreading still zoom', async ({ page }) => {
        await openHarness(page, 'index=2');
        const center = await restingCenter(page);
        const { touch } = await chromiumInput(page);

        await touch.down(around(center, 60));
        await page.waitForTimeout(300);
        for (const spread of [80, 100, 120, 140]) {
            await touch.move(around(center, spread));
        }
        await settle(page);

        expect((await imageTransform(page, 'Image 3')).scale).toBeGreaterThan(1);
    });
});
