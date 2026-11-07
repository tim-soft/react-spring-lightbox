import type { Page } from '@playwright/test';
import {
    calls,
    chromiumInput,
    expect,
    imageTransform,
    openHarness,
    pointIn,
    settle,
    test,
} from './support';

const scrollY = (page: Page) => page.evaluate(() => window.scrollY);

const openCarousel = async (page: Page) => {
    await openHarness(page, 'inline&index=2');
    const carousel = page.getByTestId('carousel');
    await carousel.evaluate((element) =>
        element.scrollIntoView({ block: 'center' }),
    );
    await settle(page);
    return carousel;
};

test('renders inside the page without covering it', async ({ page }) => {
    const carousel = await openCarousel(page);

    await expect(page.getByTestId('lightbox-container')).toHaveCount(0);
    await expect(carousel.getByAltText('Image 3')).toBeVisible();
    await expect(page.getByText('Below the carousel')).toBeAttached();
});

test.describe('with a mouse and keyboard', () => {
    test.skip(({ isMobile }) => isMobile, 'Desktop input');

    test('a mouse drag pages', async ({ page }) => {
        const carousel = await openCarousel(page);
        const [x, y] = await pointIn(carousel, [0.8, 0.5]);

        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x - 300, y);
        await page.mouse.up();
        await settle(page);

        expect((await calls(page)).onNext).toBe(1);
    });

    test('the mouse wheel scrolls the page instead of paging', async ({
        page,
    }) => {
        const carousel = await openCarousel(page);
        const before = await scrollY(page);

        await page.mouse.move(...(await pointIn(carousel)));
        await page.mouse.wheel(0, 300);
        await page.mouse.wheel(0, 300);

        await expect.poll(() => scrollY(page)).toBeGreaterThan(before);
        expect(await calls(page)).toEqual({ onClose: 0, onNext: 0, onPrev: 0 });
    });

    test('a double click does not zoom', async ({ page }) => {
        await openCarousel(page);

        await page.getByAltText('Image 3').dblclick();
        await settle(page);

        expect((await imageTransform(page, 'Image 3')).scale).toBe(1);
    });

    test('leaves the page keys to the page around it (#65)', async ({
        page,
    }) => {
        await openCarousel(page);
        const before = await scrollY(page);

        await page.keyboard.press('PageDown');

        test.fail();
        await expect
            .poll(() => scrollY(page), { timeout: 1000 })
            .toBeGreaterThan(before);
    });
});

test.describe('on a touchscreen', () => {
    test.skip(({ isMobile }) => !isMobile, 'Touch input');

    test('a double tap does not zoom', async ({ page }) => {
        await openCarousel(page);
        const [x, y] = await pointIn(page.getByAltText('Image 3'));

        await page.touchscreen.tap(x, y);
        await page.waitForTimeout(80);
        await page.touchscreen.tap(x, y);
        await settle(page);

        expect((await imageTransform(page, 'Image 3')).scale).toBe(1);
    });
});

test.describe('swiping on a touchscreen', () => {
    test.skip(
        ({ browserName, isMobile }) => !isMobile || browserName !== 'chromium',
        'Touch input through the DevTools protocol',
    );

    test('a sideways swipe pages', async ({ page }) => {
        const carousel = await openCarousel(page);
        const [x, y] = await pointIn(carousel, [0.8, 0.5]);
        const { touch } = await chromiumInput(page);

        await touch.swipe([
            [x, y],
            [x - 60, y],
        ]);
        await settle(page);

        expect((await calls(page)).onNext).toBe(1);
    });

    test('an upward swipe over the images scrolls the page', async ({
        page,
    }) => {
        const carousel = await openCarousel(page);
        const [x, y] = await pointIn(carousel, [0.5, 0.8]);
        const before = await scrollY(page);
        const { touch } = await chromiumInput(page);

        await touch.swipe([
            [x, y],
            [x, y - 50],
            [x, y - 100],
            [x, y - 150],
        ]);

        await expect.poll(() => scrollY(page)).toBeGreaterThan(before);
        expect(await calls(page)).toEqual({ onClose: 0, onNext: 0, onPrev: 0 });
    });
});
