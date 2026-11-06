import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openHarness, settle } from './support';

/** Opens Image 1 from the gallery and returns which images the browser fetched */
const openAndCollectImageRequests = async (page: Page, query: string) => {
    const requested = new Set<string>();
    page.on('request', (request) => {
        const match = /\/images\/(\d)\.svg$/.exec(request.url());
        if (match) requested.add(`Image ${match[1]}`);
    });
    await openHarness(page, `closed&${query}`);

    await page.getByRole('button', { name: 'Open Image 1' }).click();
    await settle(page);

    return requested;
};

test.describe('image downloads', () => {
    test.skip(({ isMobile }) => isMobile, 'Desktop browsers cover this');

    test('opening downloads every image, even those far from the current one (#26)', async ({
        page,
    }) => {
        const requested = await openAndCollectImageRequests(page, '');

        expect([...requested].sort()).toEqual([
            'Image 1',
            'Image 2',
            'Image 3',
            'Image 4',
            'Image 5',
        ]);
    });

    test('with loading: "lazy", images far from the current one wait', async ({
        browserName,
        page,
    }) => {
        test.skip(
            browserName === 'webkit',
            'WebKit downloads lazy images even inside display: none pages',
        );
        const requested = await openAndCollectImageRequests(page, 'lazy');

        expect(requested.has('Image 1')).toBe(true);
        expect(requested.has('Image 3')).toBe(false);
        expect(requested.has('Image 5')).toBe(false);
    });
});

test('renders the header above the image and the footer below it', async ({
    page,
}) => {
    await openHarness(page);

    const header = await page.getByRole('banner').boundingBox();
    const image = await page.getByAltText('Image 1').boundingBox();
    const footer = await page.getByRole('contentinfo').boundingBox();

    expect(header && image && footer).toBeTruthy();
    if (!header || !image || !footer) return;
    expect(header.y + header.height).toBeLessThanOrEqual(image.y + 1);
    expect(footer.y).toBeGreaterThanOrEqual(image.y + image.height - 1);
});

test('fits each image within the stage, leaving room for controls', async ({
    page,
}) => {
    await openHarness(page, 'index=1');

    const viewport = page.viewportSize();
    const box = await page.getByAltText('Image 2').boundingBox();

    expect(viewport && box).toBeTruthy();
    if (!viewport || !box) return;
    expect(box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.height).toBeLessThan(viewport.height - 50);
});

test('the image overlay sits over the image', async ({ page }) => {
    await openHarness(page, 'overlay');

    const image = await page.getByAltText('Image 1').boundingBox();
    const share = await page
        .getByRole('button', { name: 'Share' })
        .first()
        .boundingBox();

    expect(image && share).toBeTruthy();
    if (!image || !share) return;
    expect(share.x).toBeGreaterThanOrEqual(image.x - 1);
    expect(share.x + share.width).toBeLessThanOrEqual(
        image.x + image.width + 1,
    );
    expect(share.y).toBeGreaterThanOrEqual(image.y - 1);
});
