import type { Page } from '@playwright/test';
import {
    calls,
    chromiumInput,
    expect,
    openHarness,
    pointIn,
    sampleFrames,
    settle,
    shownImage,
    test,
} from './support';
import type { Point } from './support';

const container = (page: Page) => page.getByTestId('lightbox-container');
const scrollY = (page: Page) => page.evaluate(() => window.scrollY);

test.describe('with a mouse and keyboard', () => {
    test.skip(({ isMobile }) => isMobile, 'Desktop input');

    test('opens on the clicked image, fading in', async ({ page }) => {
        await openHarness(page, 'closed');

        await page.getByRole('button', { name: 'Open Image 3' }).click();
        const opacities = await sampleFrames(container(page), 'opacity', 6);
        await settle(page);

        expect(opacities[0]).toBeLessThan(1);
        expect(opacities[0]).toBeLessThan(opacities[opacities.length - 1]);
        await expect(container(page)).toHaveCSS('opacity', '1');
        expect(await shownImage(page)).toBe('Image 3');
    });

    test('Esc closes it, fading out before it unmounts', async ({ page }) => {
        await openHarness(page);

        await page.keyboard.press('Escape');
        const opacities = await sampleFrames(container(page), 'opacity', 4);

        expect(opacities[0]).toBeGreaterThan(opacities[opacities.length - 1]);
        await expect(container(page)).toHaveCount(0);
        expect((await calls(page)).onClose).toBe(1);
    });

    test('clicking the backdrop closes it', async ({ page }) => {
        await openHarness(page);

        await page.mouse.click(20, 200);

        await expect(container(page)).toHaveCount(0);
    });

    test('the Close button in the header closes it', async ({ page }) => {
        await openHarness(page);

        await page.getByRole('button', { name: 'Close' }).click();

        await expect(container(page)).toHaveCount(0);
    });

    test('clicking the image keeps it open', async ({ page }) => {
        await openHarness(page);

        await page.getByAltText('Image 1').click();
        await page.waitForTimeout(500);

        await expect(container(page)).toBeVisible();
    });

    test('a button in the image overlay works and keeps it open', async ({
        page,
    }) => {
        await openHarness(page, 'overlay');

        await page.getByRole('button', { name: 'Share' }).first().click();

        await expect(page).toHaveTitle('Shared');
        await expect(container(page)).toBeVisible();
    });

    test('clicking the backdrop while zoomed in keeps it open', async ({
        page,
    }) => {
        await openHarness(page);
        await page.getByAltText('Image 1').dblclick();
        await settle(page);

        await page.mouse.click(20, 200);
        await page.waitForTimeout(500);

        await expect(container(page)).toBeVisible();
    });

    test('a drag across the backdrop keeps it open, though the browser clicks at the end', async ({
        page,
    }) => {
        await openHarness(page, 'index=2');

        await page.mouse.move(100, 200);
        await page.mouse.down();
        await page.waitForTimeout(100);
        await page.mouse.move(160, 200);
        await page.waitForTimeout(100);
        await page.mouse.up();
        await page.waitForTimeout(500);

        await expect(container(page)).toBeVisible();
    });

    test('the page behind does not scroll while open, and does once closed', async ({
        page,
    }) => {
        await openHarness(page);

        await page.mouse.move(640, 300);
        await page.mouse.wheel(0, 600);
        for (const key of ['ArrowDown', 'PageDown', 'End']) {
            await page.keyboard.press(key);
        }
        await page.waitForTimeout(300);
        expect(await scrollY(page)).toBe(0);

        await page.keyboard.press('Escape');
        await expect(container(page)).toHaveCount(0);
        await page.keyboard.press('PageDown');
        await expect.poll(() => scrollY(page)).toBeGreaterThan(0);
    });

    test('Space does not scroll the page behind', async ({ page }) => {
        await openHarness(page);

        await page.keyboard.press('Space');
        await page.waitForTimeout(300);
        const scrolled = await scrollY(page);

        test.fail(true, 'Space is missing from the keys the lightbox blocks');
        expect(scrolled).toBe(0);
    });

    test('a text field in the footer keeps its Home and End keys (#65)', async ({
        page,
    }) => {
        await openHarness(page, 'footerInput');
        const caption = page.getByRole('textbox', { name: 'Caption' });
        await caption.click();
        // Whether the browser may move the caret, as it does for a person typing
        await caption.evaluate((input) => {
            const prevented: boolean[] = [];
            Object.assign(window, { prevented });
            input.addEventListener('keydown', (event) =>
                setTimeout(() => prevented.push(event.defaultPrevented)),
            );
        });

        await page.keyboard.press('Home');
        await page.keyboard.press('End');
        await page.waitForTimeout(100);
        const prevented = await page.evaluate(
            () => (window as unknown as { prevented: boolean[] }).prevented,
        );

        test.fail();
        expect(prevented).toEqual([false, false]);
    });
});

test.describe('on a touchscreen', () => {
    test.skip(({ isMobile }) => !isMobile, 'Touch input');

    test('tapping the backdrop closes it', async ({ page }) => {
        await openHarness(page);

        await page.touchscreen.tap(10, 200);

        await expect(container(page)).toHaveCount(0);
    });

    test('tapping the image keeps it open', async ({ page }) => {
        await openHarness(page);

        const [x, y] = await pointIn(page.getByAltText('Image 1'));
        await page.touchscreen.tap(x, y);
        await page.waitForTimeout(500);

        await expect(container(page)).toBeVisible();
    });

    test('a swipe up the footer does not scroll the page behind', async ({
        browserName,
        page,
    }) => {
        test.skip(
            browserName !== 'chromium',
            'Touch input through the DevTools protocol',
        );
        await openHarness(page);
        const { touch } = await chromiumInput(page);
        const [x, y] = await pointIn(page.getByRole('contentinfo'));

        await touch.swipe(
            [0, 1, 2, 3, 4].map((step): Point => [x, y - step * 60]),
            30,
        );
        await page.waitForTimeout(600);
        const scrolled = await scrollY(page);

        test.fail(true, 'Only the image stage sets touch-action: none');
        expect(scrolled).toBe(0);
    });
});

test('closing returns to the same place on a long page', async ({ page }) => {
    await openHarness(page, 'closed');
    const viewFirst = page.getByRole('button', {
        name: 'View the first image from the bottom of the page',
    });
    await viewFirst.scrollIntoViewIfNeeded();
    const before = await scrollY(page);

    await viewFirst.click();
    await settle(page);
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(container(page)).toHaveCount(0);

    expect(before).toBeGreaterThan(1000);
    expect(await scrollY(page)).toBe(before);
});
