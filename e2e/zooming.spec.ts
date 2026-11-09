import type { Locator, Page } from '@playwright/test';

import type { Point } from './support';

import {
    calls,
    chromiumInput,
    expect,
    imageTransform,
    openHarness,
    pointIn,
    sampleFrames,
    settle,
    test,
} from './support';

const scaleOf = async (page: Page, alt = 'Image 3') => (await imageTransform(page, alt)).scale;

/** The point at `fraction` of the image is still at `screenPoint` */
const expectKeptInPlace = async (image: Locator, fraction: Point, [x, y]: Point) => {
    const [nowX, nowY] = await pointIn(image, fraction);
    expect(Math.abs(nowX - x)).toBeLessThan(4);
    expect(Math.abs(nowY - y)).toBeLessThan(4);
};

const OFF_CENTER: Point = [0.3, 0.35];

test.describe('with a mouse', () => {
    test.skip(({ isMobile }) => isMobile, 'Mouse input');

    test('a double click zooms in 2x, keeping the clicked point under the cursor', async ({ page }) => {
        await openHarness(page, 'index=2');
        const image = page.getByAltText('Image 3');
        const point = await pointIn(image, OFF_CENTER);

        await page.mouse.dblclick(...point);
        await settle(page);

        expect(await scaleOf(page)).toBeCloseTo(2, 2);
        await expectKeptInPlace(image, OFF_CENTER, point);
    });

    test('the zoom animates', async ({ page }) => {
        await openHarness(page, 'index=2');

        await page.getByAltText('Image 3').dblclick();
        await page.waitForTimeout(150);
        const scales = await sampleFrames(page.getByAltText('Image 3'), 'scale', 20);

        expect(scales.some((scale) => scale > 1 && scale < 2)).toBe(true);
    });

    test('another double click zooms back out', async ({ page }) => {
        await openHarness(page, 'index=2');
        await page.getByAltText('Image 3').dblclick();
        await settle(page);

        await page.getByAltText('Image 3').dblclick();
        await settle(page);

        expect(await scaleOf(page)).toBe(1);
    });

    test('a single click does not zoom', async ({ page }) => {
        await openHarness(page, 'index=2');

        await page.getByAltText('Image 3').click();
        await settle(page);

        expect(await scaleOf(page)).toBe(1);
    });

    test('with singleClickToZoom, one click zooms in and the next zooms out', async ({ page }) => {
        await openHarness(page, 'index=2&singleClickToZoom');

        await page.getByAltText('Image 3').click();
        await settle(page);
        expect(await scaleOf(page)).toBeCloseTo(2, 2);

        await page.getByAltText('Image 3').click();
        await settle(page);
        expect(await scaleOf(page)).toBe(1);
    });

    test('ctrl + wheel zooms in toward the cursor', async ({ page }) => {
        await openHarness(page, 'index=2');
        const image = page.getByAltText('Image 3');
        const point = await pointIn(image, OFF_CENTER);

        await page.mouse.move(...point);
        await page.keyboard.down('Control');
        await page.mouse.wheel(0, -40);
        await page.keyboard.up('Control');
        await settle(page);
        const scale = await scaleOf(page);

        expect(scale).toBeGreaterThan(1);
        await expectKeptInPlace(image, OFF_CENTER, point);
        expect(await calls(page)).toEqual({ onClose: 0, onNext: 0, onPrev: 0 });
    });

    test('the zoom resets once another image is shown', async ({ page }) => {
        await openHarness(page, 'index=2');
        await page.getByAltText('Image 3').dblclick();
        await settle(page);

        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowLeft');
        await settle(page);

        expect(await scaleOf(page)).toBe(1);
    });
});

test.describe('with a trackpad pinch in Chromium', () => {
    test.skip(
        ({ browserName, isMobile }) => isMobile || browserName !== 'chromium',
        'Trackpad gestures through the DevTools protocol'
    );

    test('zooms in toward the fingers', async ({ page }) => {
        await openHarness(page, 'index=2');
        const image = page.getByAltText('Image 3');
        const point = await pointIn(image, OFF_CENTER);
        const { trackpadPinch } = await chromiumInput(page);

        await trackpadPinch(point, 1.6);
        await settle(page);

        expect(await scaleOf(page)).toBeGreaterThan(1);
        await expectKeptInPlace(image, OFF_CENTER, point);
    });

    test('stops zooming in at 3x', async ({ page }) => {
        await openHarness(page, 'index=2');
        const { trackpadPinch } = await chromiumInput(page);

        await trackpadPinch(await pointIn(page.getByAltText('Image 3')), 8);
        await settle(page);

        expect(await scaleOf(page)).toBeCloseTo(3, 2);
    });

    test('springs back to full size when pinched past 1x', async ({ page }) => {
        await openHarness(page, 'index=2');
        const { trackpadPinch } = await chromiumInput(page);

        await trackpadPinch(await pointIn(page.getByAltText('Image 3')), 0.3);
        await settle(page);

        expect(await scaleOf(page)).toBe(1);
    });
});

test.describe('with a trackpad pinch in desktop Safari', () => {
    test.skip(({ isMobile }) => isMobile, 'Desktop input');

    test('zooms in toward the fingers', async ({ page }) => {
        await openHarness(page, 'index=2');
        test.skip(
            !(await page.evaluate(() => 'GestureEvent' in window)),
            'Only browsers with GestureEvent send trackpad pinches as gesture events'
        );
        const image = page.getByAltText('Image 3');
        const point = await pointIn(image, OFF_CENTER);

        // WebKit doesn't let tests synthesize trackpad gestures, so send the
        // gesture events Safari would, with its scale and position fields
        await image.evaluate(async (img, [clientX, clientY]) => {
            const gesture = (type: string, scale: number) => {
                const event = new Event(type, {
                    bubbles: true,
                    cancelable: true,
                });
                Object.assign(event, { clientX, clientY, rotation: 0, scale });
                img.dispatchEvent(event);
            };
            const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
            gesture('gesturestart', 1);
            for (const scale of [1.2, 1.4, 1.6]) {
                await frame();
                gesture('gesturechange', scale);
            }
            gesture('gestureend', 1.6);
        }, point);
        await settle(page);

        expect(await scaleOf(page)).toBeGreaterThan(1);
        await expectKeptInPlace(image, OFF_CENTER, point);
    });
});

test.describe('with taps', () => {
    test.skip(({ isMobile }) => !isMobile, 'Touch input');

    test('a double tap zooms in 2x, keeping the tapped point under the finger', async ({ page }) => {
        await openHarness(page, 'index=2');
        const image = page.getByAltText('Image 3');
        const point = await pointIn(image, OFF_CENTER);

        await page.touchscreen.tap(...point);
        await page.waitForTimeout(80);
        await page.touchscreen.tap(...point);
        await settle(page);

        expect(await scaleOf(page)).toBeCloseTo(2, 2);
        await expectKeptInPlace(image, OFF_CENTER, point);
    });

    test('turning the phone keeps the zoom, and turning it back restores the view', async ({ page }) => {
        await openHarness(page, 'index=2');
        const image = page.getByAltText('Image 3');
        const point = await pointIn(image, OFF_CENTER);
        await page.touchscreen.tap(...point);
        await page.waitForTimeout(80);
        await page.touchscreen.tap(...point);
        await settle(page);
        const zoomedIn = await image.boundingBox();
        const portrait = page.viewportSize();
        if (!zoomedIn || !portrait) {
            throw new Error('Image 3 is not visible');
        }

        await page.setViewportSize({
            height: portrait.width,
            width: portrait.height,
        });
        await settle(page);
        expect(await scaleOf(page)).toBeCloseTo(2, 2);

        await page.setViewportSize(portrait);
        await settle(page);
        const turnedBack = await image.boundingBox();
        for (const side of ['x', 'y', 'width', 'height'] as const) {
            expect(Math.abs((turnedBack?.[side] ?? 0) - zoomedIn[side])).toBeLessThan(1);
        }
        expect(await calls(page)).toEqual({ onClose: 0, onNext: 0, onPrev: 0 });
    });
});

test.describe('with two fingers', () => {
    test.skip(
        ({ browserName, isMobile }) => !isMobile || browserName !== 'chromium',
        'Multi-touch through the DevTools protocol'
    );

    const fingersAround = async (page: Page, spread: number): Promise<[Point, Point]> => {
        const [x, y] = await pointIn(page.getByAltText('Image 3'));
        return [
            [x - spread, y],
            [x + spread, y],
        ];
    };

    test('spreading them zooms in around them', async ({ page }) => {
        await openHarness(page, 'index=2');
        const image = page.getByAltText('Image 3');
        const center = await pointIn(image);
        const { touch } = await chromiumInput(page);

        await touch.pinch(await fingersAround(page, 30), await fingersAround(page, 90));
        await settle(page);

        expect(await scaleOf(page)).toBeGreaterThan(1);
        await expectKeptInPlace(image, [0.5, 0.5], center);
    });

    test('pinching them together past 1x springs back to full size', async ({ page }) => {
        await openHarness(page, 'index=2');
        const { touch } = await chromiumInput(page);

        await touch.pinch(await fingersAround(page, 120), await fingersAround(page, 20));
        await settle(page);

        expect(await scaleOf(page)).toBe(1);
    });

    test('stops zooming in at 3x', async ({ page }) => {
        await openHarness(page, 'index=2');
        const { touch } = await chromiumInput(page);

        await touch.pinch(await fingersAround(page, 20), await fingersAround(page, 180), 16);
        await settle(page);

        expect(await scaleOf(page)).toBeCloseTo(3, 2);
    });

    test('stays zoomed in after they lift, and a swipe then does not page', async ({ page }) => {
        await openHarness(page, 'index=2');
        const { touch } = await chromiumInput(page);
        await touch.pinch(await fingersAround(page, 30), await fingersAround(page, 90));
        await settle(page);

        await touch.swipe([
            [300, 300],
            [100, 300],
        ]);
        await settle(page);

        expect(await scaleOf(page)).toBeGreaterThan(1);
        expect((await calls(page)).onNext).toBe(0);
    });

    test('lifting them keeps the zoom the pinch ended on (#17)', async ({ page }) => {
        await openHarness(page, 'index=2');
        const { touch } = await chromiumInput(page);
        const from = await fingersAround(page, 30);
        const to = await fingersAround(page, 90);

        await touch.down(from);
        for (let step = 1; step <= 8; step += 1) {
            await touch.move([
                [from[0][0] + ((to[0][0] - from[0][0]) * step) / 8, from[0][1]],
                [from[1][0] + ((to[1][0] - from[1][0]) * step) / 8, from[1][1]],
            ]);
        }
        await settle(page);
        const pinched = await scaleOf(page);
        await touch.lift();
        await settle(page);
        const lifted = await scaleOf(page);

        expect(lifted).toBeCloseTo(pinched, 2);
    });
});
