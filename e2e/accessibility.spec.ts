import type { Page } from '@playwright/test';

import { expect, openHarness, sampleFrames, settle, shownImage, test } from './support';

// What keyboard, screen reader and reduced-motion users need from a modal.

/** Opens Image 3 from its thumbnail with the keyboard */
const openWithKeyboard = async (page: Page) => {
    await openHarness(page, 'closed');
    await page.getByRole('button', { name: 'Open Image 3' }).focus();
    await page.keyboard.press('Enter');
    await settle(page);
};

const focusIsInLightbox = (page: Page) =>
    page.evaluate(() => Boolean(document.activeElement?.closest('[data-testid="lightbox-container"]')));

test.describe('with a keyboard', () => {
    test.skip(({ isMobile }) => isMobile, 'Keyboard input');

    test('Esc goes back to the thumbnail that opened it', async ({ page }) => {
        await openWithKeyboard(page);

        await page.keyboard.press('Escape');

        await expect(page.getByTestId('lightbox-container')).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Open Image 3' })).toBeFocused();
    });

    test('focus moves into the lightbox when it opens', async ({ page }) => {
        await openWithKeyboard(page);

        expect(await focusIsInLightbox(page)).toBe(true);
    });

    test('Tab cycles through the lightbox, never reaching the page behind', async ({ browserName, page }) => {
        test.skip(browserName === 'webkit', 'WebKit on macOS tabs only to text fields by default');
        await openWithKeyboard(page);
        const stayedInside: boolean[] = [];
        for (let press = 0; press < 6; press += 1) {
            await page.keyboard.press('Tab');
            stayedInside.push(await focusIsInLightbox(page));
        }

        expect(stayedInside).toEqual(Array(6).fill(true));
    });

    test('screen readers announce it as a dialog', async ({ page }) => {
        await openWithKeyboard(page);

        await expect(page.getByRole('dialog')).toHaveCount(1);
        await expect(page.getByRole('dialog', { name: 'Image gallery' })).toBeVisible();
    });

    test('Enter after paging with the arrow keys presses nothing behind the lightbox', async ({ page }) => {
        await openWithKeyboard(page);

        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');
        await settle(page);

        expect(await shownImage(page)).toBe('Image 5');
    });

    test('Enter on Close closes it and focus goes back to the thumbnail', async ({ page }) => {
        await openWithKeyboard(page);
        await page.getByRole('button', { name: 'Close' }).focus();

        await page.keyboard.press('Enter');

        await expect(page.getByTestId('lightbox-container')).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Open Image 3' })).toBeFocused();
    });

    test('an element portaled to the body after it opens can still be focused and clicked', async ({ page }) => {
        await openHarness(page, 'closed&portalMenu');
        await page.getByRole('button', { name: 'Open Image 3' }).click();
        await settle(page);

        await page.getByRole('button', { name: 'Menu' }).click();
        const item = page.getByRole('button', { name: 'Portaled item' });
        await item.focus();
        await expect(item).toBeFocused();
        await item.click();

        await expect(page).toHaveTitle('Picked');
    });
});

test('opens without animating when the user prefers reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openHarness(page, 'closed');

    await page.getByRole('button', { name: 'Open Image 3' }).click();
    const [firstFrame] = await sampleFrames(page.getByTestId('lightbox-container'), 'opacity', 1);

    test.fail(true, 'The springs ignore prefers-reduced-motion');
    expect(firstFrame).toBe(1);
});
