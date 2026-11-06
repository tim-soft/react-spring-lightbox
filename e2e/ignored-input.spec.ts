import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
    calls,
    chromiumInput,
    imageTransform,
    openHarness,
    pointIn,
    settle,
    shownImage,
} from './support';

// Input the gallery should not react to: saving an image, and touches that
// land beside the images

/** Nothing paged, zoomed or closed */
const expectUntouched = async (page: Page) => {
    expect(await calls(page)).toEqual({ onClose: 0, onNext: 0, onPrev: 0 });
    expect(await shownImage(page)).toBe('Image 3');
    expect((await imageTransform(page, 'Image 3')).scale).toBe(1);
};

test.describe('saving an image with a right click', () => {
    test.skip(({ isMobile }) => isMobile, 'Mouse input');

    test('right clicks on the image or the backdrop leave the gallery and the browser menu alone', async ({
        page,
    }) => {
        await openHarness(page, 'index=2');
        await page.evaluate(() => {
            const menusBlocked: boolean[] = [];
            Object.assign(window, { menusBlocked });
            window.addEventListener('contextmenu', (event) =>
                menusBlocked.push(event.defaultPrevented),
            );
        });
        const onImage = await pointIn(page.getByAltText('Image 3'), [0.7, 0.5]);

        await page.mouse.click(...onImage, { button: 'right' });
        await page.mouse.click(...onImage, { button: 'right' });
        await page.mouse.click(20, 200, { button: 'right' });
        await settle(page);

        await expectUntouched(page);
        expect(
            await page.evaluate(
                () =>
                    (window as unknown as { menusBlocked: boolean[] })
                        .menusBlocked,
            ),
        ).toEqual([false, false, false]);
    });

    test('a drag with the right button does not page', async ({ page }) => {
        test.fail(true, 'react-use-gesture 9 drags with any mouse button');
        await openHarness(page, 'index=2');
        const [x, y] = await pointIn(page.getByAltText('Image 3'), [0.7, 0.5]);

        await page.mouse.move(x, y);
        await page.mouse.down({ button: 'right' });
        await page.mouse.move(x - 300, y, { steps: 5 });
        await page.mouse.up({ button: 'right' });
        await settle(page);

        await expectUntouched(page);
    });
});

test.describe('on a touchscreen', () => {
    test.skip(({ isMobile }) => !isMobile, 'Touch input');

    test('a double tap on a button over the image presses it without zooming', async ({
        page,
    }) => {
        await openHarness(page, 'index=2&overlay');
        const share = page
            .getByAltText('Image 3')
            .locator('..')
            .getByRole('button', { name: 'Share' });
        const point = await pointIn(share);

        await page.touchscreen.tap(...point);
        await page.waitForTimeout(80);
        await page.touchscreen.tap(...point);
        await settle(page);

        await expect(page).toHaveTitle('Shared');
        await expectUntouched(page);
    });
});

test.describe('touches through the DevTools protocol', () => {
    test.skip(
        ({ browserName, isMobile }) => !isMobile || browserName !== 'chromium',
        'Touch input through the DevTools protocol',
    );

    test('holding a finger on the image, as to save it, leaves the gallery alone', async ({
        page,
    }) => {
        await openHarness(page, 'index=2');
        const point = await pointIn(page.getByAltText('Image 3'), [0.7, 0.5]);
        const { touch } = await chromiumInput(page);

        await touch.down([point]);
        await page.waitForTimeout(1000);
        await touch.lift();
        await settle(page);

        await expectUntouched(page);
    });

    test('swiping across the caption does not page', async ({ page }) => {
        await openHarness(page, 'index=2');
        const [x, y] = await pointIn(page.getByRole('contentinfo'), [0.8, 0.5]);
        const { touch } = await chromiumInput(page);

        await touch.swipe([
            [x, y],
            [x - 100, y],
            [x - 200, y],
        ]);
        await settle(page);

        await expectUntouched(page);
    });

    test('pinching the backdrop zooms neither the image nor the page', async ({
        page,
    }) => {
        await openHarness(page, 'index=2');
        const box = await page.getByAltText('Image 3').boundingBox();
        if (!box) throw new Error('Image 3 is not visible');
        const x = box.x + box.width / 2;
        const aboveImage = box.y - 40;
        const { touch } = await chromiumInput(page);

        await touch.pinch(
            [
                [x - 20, aboveImage],
                [x + 20, aboveImage],
            ],
            [
                [x - 120, aboveImage],
                [x + 120, aboveImage],
            ],
        );
        await settle(page);

        await expectUntouched(page);
        expect(await page.evaluate(() => window.visualViewport?.scale)).toBe(1);
    });
});
