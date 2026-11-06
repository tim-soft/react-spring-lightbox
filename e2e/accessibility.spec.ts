import type { Page } from '@playwright/test';
import { expect, openHarness, sampleFrames, settle, test } from './support';

// What keyboard, screen reader and reduced-motion users need from a modal.
// The expected failures follow the WAI-ARIA dialog pattern.

/** Opens Image 3 from its thumbnail with the keyboard */
const openWithKeyboard = async (page: Page) => {
    await openHarness(page, 'closed');
    await page.getByRole('button', { name: 'Open Image 3' }).focus();
    await page.keyboard.press('Enter');
    await settle(page);
};

const focusIsInLightbox = (page: Page) =>
    page.evaluate(
        () =>
            !!document.activeElement?.closest(
                '[data-testid="lightbox-container"]',
            ),
    );

test.describe('with a keyboard', () => {
    test.skip(({ isMobile }) => isMobile, 'Keyboard input');

    test('Esc goes back to the thumbnail that opened it', async ({ page }) => {
        await openWithKeyboard(page);

        await page.keyboard.press('Escape');

        await expect(page.getByTestId('lightbox-container')).toHaveCount(0);
        await expect(
            page.getByRole('button', { name: 'Open Image 3' }),
        ).toBeFocused();
    });

    test('focus moves into the lightbox when it opens', async ({ page }) => {
        test.fail(true, 'Focus stays on the thumbnail behind the lightbox');
        await openWithKeyboard(page);

        expect(await focusIsInLightbox(page)).toBe(true);
    });

    test('Tab cycles through the lightbox, never reaching the page behind', async ({
        browserName,
        page,
    }) => {
        test.skip(
            browserName === 'webkit',
            'WebKit on macOS tabs only to text fields by default',
        );
        test.fail(true, 'Tab reaches the thumbnails behind the lightbox');
        await openWithKeyboard(page);

        for (let press = 0; press < 6; press += 1) {
            await page.keyboard.press('Tab');
            expect(await focusIsInLightbox(page)).toBe(true);
        }
    });

    test('screen readers announce it as a dialog', async ({ page }) => {
        test.fail(true, 'Nothing in the lightbox has role="dialog"');
        await openWithKeyboard(page);

        expect(await page.getByRole('dialog').count()).toBe(1);
    });
});

test('opens without animating when the user prefers reduced motion', async ({
    page,
}) => {
    test.fail(true, 'The springs ignore prefers-reduced-motion');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openHarness(page, 'closed');

    await page.getByRole('button', { name: 'Open Image 3' }).click();
    const [firstFrame] = await sampleFrames(
        page.getByTestId('lightbox-container'),
        'opacity',
        1,
    );

    expect(firstFrame).toBe(1);
});
