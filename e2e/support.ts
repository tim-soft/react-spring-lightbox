import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

export type Point = [x: number, y: number];

type Calls = Record<'onClose' | 'onNext' | 'onPrev', number>;

/** Opens the harness with query flags, such as `index=2` or `singleClickToZoom` */
export const openHarness = async (page: Page, query = '') => {
    await page.goto(`/?${query}`);
    if (!query.includes('closed') && !query.includes('inline')) {
        await expect(page.getByTestId('lightbox-container')).toHaveCSS(
            'opacity',
            '1',
        );
    }
    await settle(page);
};

/**
 * Waits until the lightbox, its pages and its images stop moving. The first
 * 300ms cover the double click delay and a slow first animation frame.
 */
export const settle = async (page: Page) => {
    await page.waitForTimeout(300);
    let last = '';
    await expect
        .poll(
            async () => {
                const now = await page.evaluate(() =>
                    [
                        ...document.querySelectorAll(
                            'img, .lightbox-container, .lightbox-image-pager',
                        ),
                    ]
                        .map((element) => {
                            const { opacity, transform } =
                                getComputedStyle(element);
                            return `${transform} ${opacity}`;
                        })
                        .join('|'),
                );
                const still = now === last;
                last = now;
                return still;
            },
            { intervals: [150], timeout: 5000 },
        )
        .toBe(true);
};

/** How often the lightbox called onClose, onNext and onPrev */
export const calls = (page: Page) =>
    page.evaluate(
        () => (window as unknown as { lightboxCalls: Calls }).lightboxCalls,
    );

/** The alt text of the image centered in the viewport */
export const shownImage = (page: Page) =>
    page.evaluate(() => {
        const middle = window.innerWidth / 2;
        const shown = [...document.querySelectorAll('img')].find((img) => {
            const { left, width } = img.getBoundingClientRect();
            return width > 0 && Math.abs(left + width / 2 - middle) < 2;
        });
        return shown?.getAttribute('alt');
    });

/** The scale and translate offsets the lightbox applies to an image */
export const imageTransform = (page: Page, alt: string) =>
    page.getByAltText(alt).evaluate((img) => {
        const { a, e, f } = new DOMMatrix(getComputedStyle(img).transform);
        return { scale: a, x: e, y: f };
    });

/** A point inside an element, as fractions of its width and height */
export const pointIn = async (
    locator: Locator,
    [fractionX, fractionY]: Point = [0.5, 0.5],
): Promise<Point> => {
    const box = await locator.boundingBox();
    if (!box) throw new Error('element is not visible');
    return [box.x + box.width * fractionX, box.y + box.height * fractionY];
};

type Sampled = 'centerX' | 'opacity' | 'scale';

/** Reads a value from an element on each of the next `frames` animation frames */
export const sampleFrames = (locator: Locator, sampled: Sampled, frames = 12) =>
    locator.evaluate(
        (element, [what, count]) =>
            new Promise<number[]>((resolve) => {
                const values: number[] = [];
                const read = () => {
                    const style = getComputedStyle(element);
                    if (what === 'opacity') return Number(style.opacity);
                    if (what === 'scale') {
                        return new DOMMatrix(style.transform).a;
                    }
                    const { left, width } = element.getBoundingClientRect();
                    return left + width / 2;
                };
                const sample = () => {
                    values.push(read());
                    if (values.length < count) requestAnimationFrame(sample);
                    else resolve(values);
                };
                requestAnimationFrame(sample);
            }),
        [sampled, frames] as const,
    );

/**
 * Chromium input through the DevTools protocol: real mouse, touch, wheel and
 * trackpad events with explicit timestamps, so gesture speeds don't depend on
 * how fast the test machine dispatches them
 */
export const chromiumInput = async (page: Page) => {
    const cdp = await page.context().newCDPSession(page);
    let time = Date.now() / 1000;
    const after = (ms: number) => (time += ms / 1000);
    const touchPoints = (points: Point[]) =>
        points.map(([x, y], id) => ({ id, x, y }));

    const touch = {
        /** Puts the fingers down one at a time */
        async down(points: Point[]) {
            for (let count = 1; count <= points.length; count += 1) {
                await cdp.send('Input.dispatchTouchEvent', {
                    timestamp: after(16),
                    touchPoints: touchPoints(points.slice(0, count)),
                    type: 'touchStart',
                });
            }
        },
        async lift() {
            await cdp.send('Input.dispatchTouchEvent', {
                timestamp: after(16),
                touchPoints: [],
                type: 'touchEnd',
            });
        },
        /** Moves the fingers `ms` after the previous event, at a finger's pace in real time */
        async move(points: Point[], ms = 16) {
            await cdp.send('Input.dispatchTouchEvent', {
                timestamp: after(ms),
                touchPoints: touchPoints(points),
                type: 'touchMove',
            });
            await page.waitForTimeout(16);
        },
        /** Two fingers moving from `from` to `to` over `steps` moves, then lifting */
        async pinch(from: [Point, Point], to: [Point, Point], steps = 8) {
            await touch.down(from);
            for (let step = 1; step <= steps; step += 1) {
                const between = (a: Point, b: Point): Point => [
                    a[0] + ((b[0] - a[0]) * step) / steps,
                    a[1] + ((b[1] - a[1]) * step) / steps,
                ];
                await touch.move([
                    between(from[0], to[0]),
                    between(from[1], to[1]),
                ]);
            }
            await touch.lift();
        },
        /** One finger from the first point through the rest, `msPerMove` apart */
        async swipe([start, ...moves]: Point[], msPerMove = 16) {
            await touch.down([start]);
            for (const point of moves) {
                await touch.move([point], msPerMove);
            }
            await touch.lift();
        },
    };

    const mouse = {
        /** Presses at the first point, moves through the rest `msPerMove` apart, then releases */
        async drag([start, ...moves]: Point[], msPerMove = 16) {
            const send = (
                type: 'mouseMoved' | 'mousePressed' | 'mouseReleased',
                [x, y]: Point,
                ms: number,
            ) =>
                cdp.send('Input.dispatchMouseEvent', {
                    button: 'left',
                    buttons: type === 'mouseReleased' ? 0 : 1,
                    clickCount: type === 'mouseMoved' ? 0 : 1,
                    timestamp: after(ms),
                    type,
                    x,
                    y,
                });
            await send('mouseMoved', start, 16);
            await send('mousePressed', start, 16);
            for (const point of moves) {
                await send('mouseMoved', point, msPerMove);
            }
            await send('mouseReleased', moves[moves.length - 1] ?? start, 16);
        },
    };

    /** One wheel event, as a mouse wheel or trackpad sends it */
    const wheel = (
        [x, y]: Point,
        { ctrl = false, deltaX = 0, deltaY = 0, ms = 16 } = {},
    ) =>
        cdp.send('Input.dispatchMouseEvent', {
            deltaX,
            deltaY,
            modifiers: ctrl ? 2 : 0,
            timestamp: after(ms),
            type: 'mouseWheel',
            x,
            y,
        });

    /** A trackpad pinch, which Chromium sends to the page as ctrl + wheel events */
    const trackpadPinch = ([x, y]: Point, scaleFactor: number) =>
        cdp.send('Input.synthesizePinchGesture', {
            gestureSourceType: 'mouse',
            scaleFactor,
            x,
            y,
        });

    return { mouse, touch, trackpadPinch, wheel };
};
