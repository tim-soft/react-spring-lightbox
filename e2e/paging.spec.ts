import type { Page } from '@playwright/test';

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
    shownImage,
    test,
} from './support';

/** Presses at `from`, then moves `dx` in four steps 100ms apart, under 2px/ms */
const slowMouseDrag = async (page: Page, [x, y]: Point, dx: number) => {
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let step = 1; step <= 4; step += 1) {
        await page.waitForTimeout(100);
        await page.mouse.move(x + (dx * step) / 4, y);
    }
    await page.mouse.up();
};

test.describe('dragging with a mouse', () => {
    test.skip(({ isMobile }) => isMobile, 'Mouse input');

    test('a slow drag left past 1/3.5 of the stage shows the next image', async ({ page }) => {
        await openHarness(page, 'index=2');

        await slowMouseDrag(page, [900, 300], -500);
        await settle(page);

        expect(await shownImage(page)).toBe('Image 4');
    });

    test('a slow drag right past 1/3.5 of the stage shows the previous image', async ({ page }) => {
        await openHarness(page, 'index=2');

        await slowMouseDrag(page, [300, 300], 500);
        await settle(page);

        expect(await shownImage(page)).toBe('Image 2');
    });

    test('a quick flick shows the next image', async ({ page }) => {
        await openHarness(page, 'index=2');

        await page.mouse.move(900, 300);
        await page.mouse.down();
        await page.mouse.move(600, 300);
        await page.mouse.up();
        await settle(page);

        expect(await shownImage(page)).toBe('Image 4');
    });

    test('a short, slow drag springs back', async ({ page }) => {
        await openHarness(page, 'index=2');

        await slowMouseDrag(page, [900, 300], -200);
        const centers = await sampleFrames(page.getByAltText('Image 3'), 'centerX', 6);
        await settle(page);

        expect(centers[0]).toBeLessThan(centers[centers.length - 1]);
        expect(await shownImage(page)).toBe('Image 3');
        expect(await calls(page)).toEqual({ onClose: 0, onNext: 0, onPrev: 0 });
    });

    test('a vertical drag does nothing', async ({ page }) => {
        await openHarness(page, 'index=2');

        await page.mouse.move(640, 150);
        await page.mouse.down();
        await page.mouse.move(640, 600, { steps: 5 });
        await page.mouse.up();
        await settle(page);

        expect(await shownImage(page)).toBe('Image 3');
    });

    test('does not ask for an image before the first or after the last', async ({ page }) => {
        await openHarness(page, 'index=0');
        await slowMouseDrag(page, [300, 300], 500);
        await settle(page);
        expect((await calls(page)).onPrev).toBe(0);

        await openHarness(page, 'index=4');
        await slowMouseDrag(page, [900, 300], -500);
        await settle(page);
        expect((await calls(page)).onNext).toBe(0);
    });

    test('does not page while the image is zoomed in', async ({ page }) => {
        await openHarness(page, 'index=2');
        await page.getByAltText('Image 3').dblclick();
        await settle(page);

        await slowMouseDrag(page, [900, 300], -500);
        await settle(page);

        expect((await calls(page)).onNext).toBe(0);
    });

    test('two drags in quick succession move two images, the second mid-slide', async ({ page }) => {
        await openHarness(page, 'index=1');

        for (let drag = 0; drag < 2; drag += 1) {
            await page.mouse.move(900, 300);
            await page.mouse.down();
            await page.mouse.move(400, 300);
            await page.mouse.up();
            await page.waitForTimeout(30);
        }
        await settle(page);

        expect(await shownImage(page)).toBe('Image 4');
        expect((await calls(page)).onNext).toBe(2);
    });
});

test.describe('swiping on a touchscreen', () => {
    test.skip(
        ({ browserName, isMobile }) => !isMobile || browserName !== 'chromium',
        'Multi-touch through the DevTools protocol'
    );

    test('a slow swipe pages in either direction', async ({ page }) => {
        await openHarness(page, 'index=2');
        const { touch } = await chromiumInput(page);

        await touch.swipe(
            [
                [350, 300],
                [275, 300],
                [200, 300],
                [125, 300],
                [50, 300],
            ],
            100
        );
        await settle(page);
        expect(await shownImage(page)).toBe('Image 4');

        await touch.swipe(
            [
                [50, 300],
                [125, 300],
                [200, 300],
                [275, 300],
                [350, 300],
            ],
            100
        );
        await settle(page);
        expect(await shownImage(page)).toBe('Image 3');
    });

    test('a quick flick shows the next image', async ({ page }) => {
        await openHarness(page, 'index=2');
        const { touch } = await chromiumInput(page);

        await touch.swipe([
            [300, 300],
            [240, 300],
        ]);
        await settle(page);

        expect(await shownImage(page)).toBe('Image 4');
    });

    test('a short, slow swipe springs back', async ({ page }) => {
        await openHarness(page, 'index=2');
        const { touch } = await chromiumInput(page);

        await touch.swipe(
            [
                [300, 300],
                [260, 300],
                [220, 300],
            ],
            100
        );
        await settle(page);

        expect(await shownImage(page)).toBe('Image 3');
        expect((await calls(page)).onNext).toBe(0);
    });

    test('a vertical swipe does nothing', async ({ page }) => {
        await openHarness(page, 'index=2');
        const { touch } = await chromiumInput(page);

        await touch.swipe([
            [200, 200],
            [200, 400],
            [200, 600],
        ]);
        await settle(page);

        expect(await shownImage(page)).toBe('Image 3');
    });

    test('two fingers moving together do not page', async ({ page }) => {
        await openHarness(page, 'index=2');
        const { touch } = await chromiumInput(page);

        await touch.down([
            [250, 250],
            [300, 250],
        ]);
        for (let step = 1; step <= 6; step += 1) {
            await touch.move([
                [250 - step * 35, 250],
                [300 - step * 35, 250],
            ]);
        }
        await touch.lift();
        await settle(page);

        expect(await shownImage(page)).toBe('Image 3');
    });

    test('two quick flicks in a row move two images, the second mid-slide', async ({ page }) => {
        await openHarness(page, 'index=1');
        const { touch } = await chromiumInput(page);

        for (let flick = 0; flick < 2; flick += 1) {
            await touch.swipe([
                [300, 300],
                [240, 300],
            ]);
            await page.waitForTimeout(30);
        }
        await settle(page);

        expect(await shownImage(page)).toBe('Image 4');
        expect((await calls(page)).onNext).toBe(2);
    });
});

test.describe('scrolling with a mouse wheel or trackpad', () => {
    test.skip(({ isMobile }) => isMobile, 'Wheel input');

    const scroll = async (page: Page, deltaX: number, deltaY: number) => {
        await page.mouse.move(640, 300);
        await page.mouse.wheel(deltaX, deltaY);
        await page.mouse.wheel(deltaX, deltaY);
        await settle(page);
    };

    test('scrolling down quickly shows the previous image', async ({ page }) => {
        await openHarness(page, 'index=2');

        await scroll(page, 0, 300);

        expect(await shownImage(page)).toBe('Image 2');
    });

    test('scrolling up quickly shows the next image', async ({ page }) => {
        await openHarness(page, 'index=2');

        await scroll(page, 0, -300);

        expect(await shownImage(page)).toBe('Image 4');
    });

    test('slow scrolling stays on the image', async ({ page }) => {
        await openHarness(page, 'index=2');

        await page.mouse.move(640, 300);
        await page.mouse.wheel(0, 10);
        await page.waitForTimeout(100);
        await page.mouse.wheel(0, 10);
        await settle(page);

        expect(await shownImage(page)).toBe('Image 3');
    });

    test('one trackpad swipe moves one image', async ({ page }) => {
        await openHarness(page, 'index=0');

        await page.mouse.move(640, 300);
        for (let tick = 0; tick < 8; tick += 1) {
            await page.mouse.wheel(-300, 0);
            await page.waitForTimeout(16);
        }
        await settle(page);
        const { onNext } = await calls(page);

        expect(onNext).toBe(1);
    });
});

test.describe('swiping on a trackpad in Chromium', () => {
    test.skip(
        ({ browserName, isMobile }) => isMobile || browserName !== 'chromium',
        'Wheel events with timestamps through the DevTools protocol'
    );

    const fingers = (peak: number) => [0.1, 0.3, 0.6, 1].map((share) => Math.round(peak * share));

    const momentum = (from: number) => {
        const deltas: number[] = [];
        for (let delta = from * 0.94; Math.abs(delta) >= 1; delta *= 0.94) {
            deltas.push(Math.round(delta));
        }
        return deltas;
    };

    const swipe = async (wheel: (point: Point, event: { deltaX: number }) => Promise<unknown>, deltasX: number[]) => {
        for (const deltaX of deltasX) {
            await wheel([640, 300], { deltaX });
        }
    };

    test('one swipe moves one image, as it keeps scrolling after the fingers lift', async ({ page }) => {
        await openHarness(page, 'index=0');
        const { wheel } = await chromiumInput(page);

        await swipe(wheel, [...fingers(-50), ...momentum(-50)]);
        await settle(page);

        expect((await calls(page)).onNext).toBe(1);
        expect(await shownImage(page)).toBe('Image 2');
    });

    test('a second swipe moves another image, even before the first one stops scrolling', async ({ page }) => {
        await openHarness(page, 'index=0');
        const { wheel } = await chromiumInput(page);

        await swipe(wheel, [...fingers(-50), ...momentum(-50).slice(0, 8)]);
        // Fingers landing on the trackpad stop the scroll. The next wheel event moves 2px in 40ms.
        await wheel([640, 300], { deltaX: -2, ms: 40 });
        await swipe(wheel, [...fingers(-50), ...momentum(-50)]);
        await settle(page);

        expect((await calls(page)).onNext).toBe(2);
        expect(await shownImage(page)).toBe('Image 3');
    });
});

test.describe('the keyboard', () => {
    test.skip(({ isMobile }) => isMobile, 'Keyboard input');

    test('→ shows the next image and ← the previous one', async ({ page }) => {
        await openHarness(page, 'index=2');

        await page.keyboard.press('ArrowRight');
        await settle(page);
        expect(await shownImage(page)).toBe('Image 4');

        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowLeft');
        await settle(page);
        expect(await shownImage(page)).toBe('Image 2');
    });

    test('arrow keys in a text field move the caret, not the gallery (#65)', async ({ page }) => {
        await openHarness(page, 'footerInput&index=2');

        await page.getByRole('textbox', { name: 'Caption' }).click();
        await page.keyboard.press('ArrowRight');
        await settle(page);
        const { onNext } = await calls(page);

        test.fail();
        expect(onNext).toBe(0);
    });
});

test.describe('arrow buttons', () => {
    test('page through the gallery and disable themselves at either end', async ({ page }) => {
        await openHarness(page, 'index=3');
        const next = page.getByRole('button', { name: 'Next' });
        const previous = page.getByRole('button', { name: 'Previous' });

        await next.click();
        await settle(page);
        expect(await shownImage(page)).toBe('Image 5');
        await expect(next).toBeDisabled();

        for (let image = 5; image > 1; image -= 1) {
            await previous.click();
        }
        await settle(page);
        expect(await shownImage(page)).toBe('Image 1');
        await expect(previous).toBeDisabled();
    });

    test('unstyled buttons are not covered by the pager (#54)', async ({ page }) => {
        await openHarness(page, 'plainButtons&index=2');

        const [x, y] = await pointIn(page.getByRole('button', { name: 'Next' }));
        const topmost = await page.evaluate(([px, py]) => document.elementFromPoint(px, py)?.textContent, [x, y]);

        test.fail();
        expect(topmost).toBe('Next');
    });

    test('a double click or tap while the next image slides in leaves the gallery at rest on it', async ({
        isMobile,
        page,
    }) => {
        await openHarness(page, 'index=1');
        const next = page.getByRole('button', { name: 'Next' });
        const { height = 0, width = 0 } = page.viewportSize() ?? {};
        const middle: Point = [width / 2, height / 2];

        if (isMobile) {
            await next.tap();
            await page.waitForTimeout(40);
            await page.touchscreen.tap(...middle);
            await page.waitForTimeout(80);
            await page.touchscreen.tap(...middle);
        } else {
            await next.click();
            await page.waitForTimeout(40);
            await page.mouse.dblclick(...middle);
        }
        await settle(page);

        expect(await calls(page)).toEqual({ onClose: 0, onNext: 1, onPrev: 0 });
        expect(await shownImage(page)).toBe('Image 3');
        expect((await imageTransform(page, 'Image 2')).scale).toBe(1);
    });
});

test('slides to the new image when currentIndex changes', async ({ page }) => {
    await openHarness(page, 'index=2');
    const middle = (page.viewportSize()?.width ?? 0) / 2;

    await page.getByRole('button', { name: 'Next' }).click();
    const centers = await sampleFrames(page.getByAltText('Image 4'), 'centerX', 6);
    await settle(page);

    expect(centers[0]).toBeGreaterThan(centers[centers.length - 1]);
    expect(centers[centers.length - 1]).toBeGreaterThan(middle);
    expect(await shownImage(page)).toBe('Image 4');
});

test('keeps the current image centered when the window resizes', async ({ page }) => {
    await openHarness(page, 'index=2');
    const { height = 0, width = 0 } = page.viewportSize() ?? {};

    await page.setViewportSize({ height: height - 100, width: width - 200 });
    await settle(page);

    expect(await shownImage(page)).toBe('Image 3');
});
