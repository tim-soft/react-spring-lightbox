import { fireEvent, render, screen } from '@testing-library/react';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { Point } from './helpers';

import Lightbox from '../index';
import { mouse, pressKey, pressMouse, touch, touchscreen, trackpad } from './devices';
import {
    CENTER,
    FRAME,
    Gallery,
    advance,
    image,
    lightboxContainer,
    lightboxProps,
    mockLayout,
    pageOf,
    settle,
    shownImage,
    translateX,
} from './helpers';

// Image 3 starts centered, with one image to page to in either direction
const START = 2;

const LEFT: Point[] = [
    [600, 300],
    [500, 300],
    [400, 300],
    [300, 300],
];
const RIGHT: Point[] = [
    [300, 300],
    [400, 300],
    [500, 300],
    [600, 300],
];
const SHORT_LEFT: Point[] = [
    [600, 300],
    [560, 300],
];

const fingers = (peak: number) => [0.1, 0.3, 0.6, 1].map((share) => Math.round(peak * share));

const momentum = (from: number) => {
    const deltas: number[] = [];
    for (let delta = from * 0.94; Math.abs(delta) >= 1; delta *= 0.94) {
        deltas.push(Math.round(delta));
    }
    return deltas;
};

let layout: ReturnType<typeof mockLayout>;

beforeEach(() => {
    layout = mockLayout();
});

/** The images a user can see, as [image number, translateX], for pages that overlap the 800px stage */
const imagesOnStage = () =>
    screen.queryAllByRole('img', { hidden: true }).flatMap((img) => {
        const page = img.closest('.lightbox-image-pager') as HTMLElement;
        const x = translateX(page);
        return page.style.display !== 'none' && Math.abs(x) < 800
            ? [[Number(img.getAttribute('alt')?.replace('Image ', '')), x]]
            : [];
    });

const openGallery = async (initialIndex = START) => {
    render(<Gallery initialIndex={initialIndex} />);
    await settle();
};

const HeaderMenu = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                type="button"
            >
                Menu
            </button>
            {isOpen && createPortal(<button type="button">Portaled item</button>, document.body)}
        </>
    );
};

describe('dragging with a mouse', () => {
    test('moves the pages along with the pointer', async () => {
        await openGallery();
        const button = pressMouse(pageOf(3), [600, 300]);

        await button.moveTo([550, 300], 100);
        await settle();
        const firstOffset = translateX(pageOf(3));
        await button.moveTo([500, 300], 100);
        await settle();

        expect(firstOffset).toBeLessThan(0);
        expect(translateX(pageOf(3)) - firstOffset).toBe(-50);
        expect(translateX(pageOf(4))).toBe(translateX(pageOf(3)) + 800);
    });

    test('a new file for the shown image while a drag is held leaves the pages under the pointer', async () => {
        const props = lightboxProps({ currentIndex: START });
        const { rerender } = render(<Lightbox {...props} />);
        await settle();
        const button = pressMouse(pageOf(3), [600, 300]);
        await button.moveTo([500, 300], 100);
        await settle();
        const dragged = translateX(pageOf(3));

        // A larger file replaces image 3, as progressive loading does
        rerender(
            <Lightbox
                {...props}
                images={props.images.map((image, index) =>
                    index === START ? { ...image, src: 'image-3-large.jpg' } : image
                )}
            />
        );
        await advance(FRAME * 5);

        expect(dragged).toBeLessThan(0);
        expect(translateX(pageOf(3))).toBe(dragged);
        button.release();
    });

    test('springs back when released short of the threshold', async () => {
        await openGallery();
        const button = pressMouse(pageOf(3), [600, 300]);
        await button.moveTo([500, 300], 100);
        await settle();
        const dragged = translateX(pageOf(3));

        button.release();
        await advance(FRAME * 3);
        expect(translateX(pageOf(3))).toBeGreaterThan(dragged);
        expect(translateX(pageOf(3))).toBeLessThan(0);

        await settle();
        expect(translateX(pageOf(3))).toBe(0);
        expect(shownImage()).toBe('Image 3');
    });

    test.each([
        ['left', LEFT, 'Image 4'],
        ['right', RIGHT, 'Image 2'],
    ])('a slow drag %s past 1/3.5 of the stage width pages', async (_, path, expected) => {
        await openGallery();

        await mouse.drag(pageOf(3), path, 100);
        await settle();

        expect(shownImage()).toBe(expected);
    });

    test('a quick flick pages', async () => {
        await openGallery();

        await mouse.drag(pageOf(3), SHORT_LEFT);
        await settle();

        expect(shownImage()).toBe('Image 4');
    });

    test('a short, slow drag stays on the image', async () => {
        await openGallery();

        await mouse.drag(pageOf(3), SHORT_LEFT, 100);
        await settle();

        expect(shownImage()).toBe('Image 3');
    });

    test('dragging the image itself pages too', async () => {
        await openGallery();

        await mouse.drag(image(3), LEFT, 100);
        await settle();

        expect(shownImage()).toBe('Image 4');
    });

    test('vertical drags do nothing', async () => {
        await openGallery();

        await mouse.drag(pageOf(3), [
            [400, 100],
            [400, 500],
        ]);
        await settle();

        expect(shownImage()).toBe('Image 3');
    });

    test('a quick drag that is mostly vertical does not page', async () => {
        await openGallery();

        await mouse.drag(pageOf(3), [
            [600, 200],
            [605, 260],
            [610, 320],
            [615, 380],
        ]);
        await settle();

        expect(shownImage()).toBe('Image 3');
    });

    test('dragging back and forth short of the threshold does not page', async () => {
        await openGallery();

        await mouse.drag(
            pageOf(3),
            [
                [600, 300],
                [500, 300],
                [400, 300],
                [500, 300],
                [600, 300],
                [500, 300],
                [400, 300],
            ],
            100
        );
        await settle();

        expect(shownImage()).toBe('Image 3');
    });

    test('does not ask for a previous image from the first one', async () => {
        const props = lightboxProps({ currentIndex: 0 });
        render(<Lightbox {...props} />);

        await mouse.drag(pageOf(1), RIGHT);
        await settle();

        expect(props.onPrev).not.toHaveBeenCalled();
        expect(translateX(pageOf(1))).toBe(0);
    });

    test('does not ask for a next image from the last one', async () => {
        const props = lightboxProps({ currentIndex: 4 });
        render(<Lightbox {...props} />);

        await mouse.drag(pageOf(5), LEFT);
        await settle();

        expect(props.onNext).not.toHaveBeenCalled();
        expect(translateX(pageOf(5))).toBe(0);
    });

    test('pages again on every further drag', async () => {
        await openGallery(0);

        for (let flick = 0; flick < 3; flick += 1) {
            await mouse.drag(pageOf(flick + 1), SHORT_LEFT);
            await settle();
        }

        expect(shownImage()).toBe('Image 4');
    });

    test('does not page while the image is zoomed in', async () => {
        await openGallery();
        await mouse.doubleClick(image(3), CENTER);
        await settle();

        await mouse.drag(pageOf(3), LEFT);
        await settle();

        expect(shownImage()).toBe('Image 3');
    });
});

describe('swiping on a touchscreen', () => {
    test.each([
        ['left', LEFT, 'Image 4'],
        ['right', RIGHT, 'Image 2'],
    ])('a slow swipe %s past 1/3.5 of the stage width pages', async (_, path, expected) => {
        await openGallery();

        await touchscreen.swipe(image(3), path, 100);
        await settle();

        expect(shownImage()).toBe(expected);
    });

    test('a quick flick pages', async () => {
        await openGallery();

        await touchscreen.swipe(image(3), SHORT_LEFT);
        await settle();

        expect(shownImage()).toBe('Image 4');
    });

    test('moves the pages along with the finger, then springs back', async () => {
        await openGallery();
        const finger = touch(image(3), [[600, 300]]);

        await finger.moveTo([[500, 300]], 100);
        await settle();
        expect(translateX(pageOf(3))).toBeLessThan(0);

        finger.lift();
        await settle();
        expect(translateX(pageOf(3))).toBe(0);
        expect(shownImage()).toBe('Image 3');
    });

    test('vertical swipes do nothing', async () => {
        await openGallery();

        await touchscreen.swipe(image(3), [
            [400, 200],
            [400, 500],
        ]);
        await settle();

        expect(shownImage()).toBe('Image 3');
    });

    test('two fingers moving together do not page', async () => {
        await openGallery();
        const fingers = touch(pageOf(3), [
            [600, 300],
            [650, 300],
        ]);

        await fingers.moveTo(
            [
                [550, 300],
                [600, 300],
            ],
            100
        );
        await fingers.moveTo(
            [
                [200, 300],
                [250, 300],
            ],
            100
        );
        fingers.lift();
        await settle();

        expect(shownImage()).toBe('Image 3');
    });

    test('swipes through several images in a row', async () => {
        await openGallery(0);

        for (let swipe = 0; swipe < 4; swipe += 1) {
            await touchscreen.swipe(image(swipe + 1), SHORT_LEFT);
            await settle();
        }

        expect(shownImage()).toBe('Image 5');
    });
});

describe('scrolling with a mouse wheel or trackpad', () => {
    test.each([
        ['down', { deltaY: 200 }, 'Image 2'],
        ['up', { deltaY: -200 }, 'Image 4'],
        ['right', { deltaX: 200 }, 'Image 2'],
        ['left', { deltaX: -200 }, 'Image 4'],
    ])('scrolling %s quickly pages to %s', async (_, delta, expected) => {
        await openGallery();

        // The first event of a scroll only measures its speed
        await trackpad.scroll(pageOf(3), { ...delta, ticks: 2 });
        await settle();

        expect(shownImage()).toBe(expected);
    });

    test('a quick scroll pages once, and not again when it ends', async () => {
        const props = lightboxProps({ currentIndex: START });
        render(<Lightbox {...props} />);

        await trackpad.scroll(pageOf(3), { deltaX: -60, ticks: 2 });
        await settle();

        expect(props.onNext).toHaveBeenCalledOnce();
    });

    test('a quick, mostly downward scroll pages back, even when it drifts left', async () => {
        const props = lightboxProps({ currentIndex: START });
        render(<Lightbox {...props} />);

        await trackpad.scroll(pageOf(3), { deltaX: -10, deltaY: 100, ticks: 2 });
        await settle();

        expect(props.onPrev).toHaveBeenCalledOnce();
        expect(props.onNext).not.toHaveBeenCalled();
    });

    test('slow scrolling stays on the image', async () => {
        await openGallery();

        fireEvent.wheel(pageOf(3), { deltaY: 10 });
        await advance(100);
        fireEvent.wheel(pageOf(3), { deltaY: 10 });
        await settle();

        expect(shownImage()).toBe('Image 3');
    });

    test('a pinch (ctrl + wheel) does not page', async () => {
        const props = lightboxProps({ currentIndex: START });
        render(<Lightbox {...props} />);

        await trackpad.pinch(pageOf(3), { deltaY: 200, ticks: 2 });
        await settle();

        expect(props.onNext).not.toHaveBeenCalled();
        expect(props.onPrev).not.toHaveBeenCalled();
    });

    test('does not page while the image is zoomed in', async () => {
        await openGallery();
        await mouse.doubleClick(image(3), CENTER);
        await settle();

        await trackpad.scroll(pageOf(3), { deltaY: 200, ticks: 2 });
        await settle();

        expect(shownImage()).toBe('Image 3');
    });

    test('one trackpad swipe pages one image', async () => {
        const props = lightboxProps({ currentIndex: START });
        render(<Lightbox {...props} />);

        await trackpad.scroll(pageOf(3), { deltaX: -600, ticks: 6 });

        expect(props.onNext).toHaveBeenCalledTimes(1);
    });

    test('one trackpad swipe pages one image, as it keeps scrolling after the fingers lift', async () => {
        const props = lightboxProps({ currentIndex: START });
        render(<Lightbox {...props} />);

        await trackpad.swipe(pageOf(3), [...fingers(-50), ...momentum(-50)]);
        await settle();

        expect(props.onNext).toHaveBeenCalledOnce();
    });

    test('a swipe on a Windows touchpad pages once, though Chrome sends an empty wheel event as the fingers lift', async () => {
        const props = lightboxProps({ currentIndex: START });
        render(<Lightbox {...props} />);

        await trackpad.swipe(pageOf(3), [...fingers(-50), 0, -50, ...momentum(-50)]);
        await settle();

        expect(props.onNext).toHaveBeenCalledOnce();
    });

    test('a swipe that slows down and speeds up again, without stopping, pages once', async () => {
        const props = lightboxProps({ currentIndex: START });
        render(<Lightbox {...props} />);

        await trackpad.swipe(pageOf(3), [...fingers(-50), -20, -8, -8, -20, -35, -50, ...momentum(-50)]);
        await settle();

        expect(props.onNext).toHaveBeenCalledOnce();
    });

    test.each([
        ['the same way', -50, 2, 0],
        ['back', 50, 1, 1],
    ])(
        'a second swipe %s pages again, even before the first one stops scrolling',
        async (_, secondPeak, nextCalls, prevCalls) => {
            const props = lightboxProps({ currentIndex: START });
            render(<Lightbox {...props} />);

            await trackpad.swipe(pageOf(3), [...fingers(-50), ...momentum(-50).slice(0, 8)]);
            // Fingers landing on the trackpad stop the scroll. The next wheel event moves 2px in 40ms.
            await advance(40 - FRAME);
            await trackpad.swipe(pageOf(3), [-2, ...fingers(secondPeak), ...momentum(secondPeak)]);
            await settle();

            expect(props.onNext).toHaveBeenCalledTimes(nextCalls);
            expect(props.onPrev).toHaveBeenCalledTimes(prevCalls);
        }
    );

    test('a mouse wheel spun quickly pages once', async () => {
        const props = lightboxProps({ currentIndex: START });
        render(<Lightbox {...props} />);

        for (let notch = 0; notch < 5; notch += 1) {
            fireEvent.wheel(pageOf(3), { deltaY: 100 });
            await advance(50);
        }
        await settle();

        expect(props.onPrev).toHaveBeenCalledOnce();
    });
});

describe('the keyboard', () => {
    test('→ shows the next image and ← the previous one', async () => {
        await openGallery();

        pressKey('ArrowRight');
        await settle();
        expect(shownImage()).toBe('Image 4');

        pressKey('ArrowLeft');
        pressKey('ArrowLeft');
        await settle();
        expect(shownImage()).toBe('Image 2');
    });

    test('→ pages once while an arrow button beside the image has focus', () => {
        const props = lightboxProps({
            currentIndex: START,
            renderNextButton: () => <button type="button">Next</button>,
        });
        render(<Lightbox {...props} />);
        screen.getByRole('button', { name: 'Next' }).focus();

        pressKey('ArrowRight');

        expect(props.onNext).toHaveBeenCalledTimes(1);
    });

    test('arrow keys do nothing while closed', () => {
        const props = lightboxProps({ currentIndex: START, isOpen: false });
        render(<Lightbox {...props} />);

        pressKey('ArrowRight');
        pressKey('ArrowLeft');

        expect(props.onNext).not.toHaveBeenCalled();
        expect(props.onPrev).not.toHaveBeenCalled();
    });

    test('other keys do nothing', () => {
        const props = lightboxProps({ currentIndex: START });
        render(<Lightbox {...props} />);

        pressKey('Enter');

        expect(props.onNext).not.toHaveBeenCalled();
        expect(props.onPrev).not.toHaveBeenCalled();
        expect(props.onClose).not.toHaveBeenCalled();
    });

    test('stops listening once unmounted', () => {
        const props = lightboxProps({ currentIndex: START });
        const { unmount } = render(<Lightbox {...props} />);

        unmount();
        pressKey('ArrowRight');

        expect(props.onNext).not.toHaveBeenCalled();
    });

    test('leaves arrow keys to a text field inside the lightbox (#65)', () => {
        const props = lightboxProps({
            currentIndex: START,
            renderFooter: () => <input aria-label="Caption" />,
        });
        render(<Lightbox {...props} />);

        pressKey('ArrowRight', screen.getByRole('textbox', { name: 'Caption' }));

        expect(props.onNext).not.toHaveBeenCalled();
    });

    test.each([
        ['a textarea', () => <textarea aria-label="Caption" />],
        [
            'a select',
            () => (
                <select aria-label="Caption">
                    <option>One</option>
                </select>
            ),
        ],
        [
            'an editable element',
            () => (
                <div
                    aria-label="Caption"
                    contentEditable
                />
            ),
        ],
    ])('also leaves arrow keys to %s', (_, renderFooter) => {
        const props = lightboxProps({ currentIndex: START, renderFooter });
        render(<Lightbox {...props} />);

        pressKey('ArrowLeft', screen.getByLabelText('Caption'));
        pressKey('ArrowRight', screen.getByLabelText('Caption'));

        expect(props.onPrev).not.toHaveBeenCalled();
        expect(props.onNext).not.toHaveBeenCalled();
    });

    test.each([
        ['Alt', { altKey: true }],
        ['Ctrl', { ctrlKey: true }],
        ['Meta', { metaKey: true }],
    ])('leaves %s+→ to the browser', (_, modifier) => {
        const props = lightboxProps({ currentIndex: START });
        render(<Lightbox {...props} />);

        pressKey('ArrowRight', lightboxContainer(), modifier);

        expect(props.onNext).not.toHaveBeenCalled();
    });

    test('keys in a menu that a header button portals to <body> neither page nor close', () => {
        const props = lightboxProps({ currentIndex: START, renderHeader: () => <HeaderMenu /> });
        render(<Lightbox {...props} />);
        mouse.click(screen.getByRole('button', { name: 'Menu' }), CENTER);
        screen.getByRole('button', { name: 'Portaled item' }).focus();

        pressKey('ArrowRight');
        pressKey('ArrowLeft');
        pressKey('Escape');

        expect(props.onNext).not.toHaveBeenCalled();
        expect(props.onPrev).not.toHaveBeenCalled();
        expect(props.onClose).not.toHaveBeenCalled();
    });
});

describe('custom arrow buttons', () => {
    test.each([
        { canNext: true, canPrev: false, currentIndex: 0 },
        { canNext: true, canPrev: true, currentIndex: 2 },
        { canNext: false, canPrev: true, currentIndex: 4 },
    ])(
        'get canPrev=$canPrev and canNext=$canNext on image $currentIndex of 5',
        ({ canNext, canPrev, currentIndex }) => {
            const renderNextButton = vi.fn(() => null);
            const renderPrevButton = vi.fn(() => null);

            render(
                <Lightbox
                    {...lightboxProps({
                        currentIndex,
                        renderNextButton,
                        renderPrevButton,
                    })}
                />
            );

            expect(renderNextButton).toHaveBeenLastCalledWith({ canNext });
            expect(renderPrevButton).toHaveBeenLastCalledWith({ canPrev });
        }
    );

    test('page through the gallery and disable themselves at either end', async () => {
        await openGallery(3);
        const next = screen.getByRole('button', { name: 'Next' });

        mouse.click(next, CENTER);
        await settle();
        expect(shownImage()).toBe('Image 5');
        expect(next).toBeDisabled();

        for (let image = 5; image > 1; image -= 1) {
            mouse.click(screen.getByRole('button', { name: 'Previous' }), CENTER);
            await settle();
        }
        expect(shownImage()).toBe('Image 1');
        expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    });
});

describe('when currentIndex changes', () => {
    test('slides to the new image', async () => {
        const props = lightboxProps({ currentIndex: START });
        const { rerender } = render(<Lightbox {...props} />);
        await settle();

        rerender(
            <Lightbox
                {...props}
                currentIndex={START + 1}
            />
        );
        await advance(FRAME * 5);
        expect(translateX(pageOf(4))).toBeGreaterThan(0);
        expect(translateX(pageOf(4))).toBeLessThan(800);

        await settle();
        expect(shownImage()).toBe('Image 4');
    });

    test('jumps straight to a distant image', async () => {
        const props = lightboxProps({ currentIndex: 0 });
        const { rerender } = render(<Lightbox {...props} />);

        rerender(
            <Lightbox
                {...props}
                currentIndex={4}
            />
        );
        await settle();

        expect(shownImage()).toBe('Image 5');
        expect(pageOf(1)).toHaveStyle({ display: 'none' });
    });

    test('keeps the shown image still when images are added before it', async () => {
        const props = lightboxProps({ currentIndex: 4 });
        const { rerender } = render(
            <Lightbox
                {...props}
                currentIndex={0}
                images={props.images.slice(4)}
            />
        );
        await settle();

        rerender(<Lightbox {...props} />);
        const offsets: number[] = [];
        for (let frame = 0; frame < 5; frame += 1) {
            await advance(FRAME);
            offsets.push(translateX(pageOf(5)));
        }

        expect(offsets).toEqual([0, 0, 0, 0, 0]);
    });

    test.each([
        { from: 1, side: -1, to: 5 },
        { from: 5, side: 1, to: 1 },
    ])('a jump from image $from to image $to slides one off the stage and the other on', async ({ from, side, to }) => {
        const props = lightboxProps({ currentIndex: from - 1 });
        const { rerender } = render(<Lightbox {...props} />);
        await settle();

        rerender(
            <Lightbox
                {...props}
                currentIndex={to - 1}
            />
        );
        const frames: number[][][] = [];
        for (let frame = 0; frame < 40; frame += 1) {
            await advance(FRAME);
            frames.push(imagesOnStage());
        }

        const leaving = frames.map((frame) => frame.find(([n]) => n === from)?.[1]);
        const arriving = frames.map((frame) => frame.find(([n]) => n === to)?.[1]);
        // The old image stays on the stage as it moves off one side
        expect(leaving.slice(0, 5)).not.toContain(undefined);
        expect(leaving.slice(0, 5).every((x) => (x as number) * side >= 0)).toBe(true);
        expect((leaving[4] as number) * side).toBeGreaterThan(0);
        // The new image comes on at once, from the other side
        const firstArrival = arriving.findIndex((x) => x !== undefined);
        expect(firstArrival).toBeGreaterThanOrEqual(0);
        expect(firstArrival).toBeLessThanOrEqual(2);
        expect(Math.sign(arriving[firstArrival] as number)).toBe(-side);
        // Nothing else crosses the stage on the way
        expect(frames.flat().filter(([n]) => n !== from && n !== to)).toEqual([]);

        await settle();
        expect(shownImage()).toBe(`Image ${to}`);
        expect(pageOf(from)).toHaveStyle({ display: 'none' });
    });

    test('resizing the window while the old image slides off lets it finish sliding off', async () => {
        const props = lightboxProps({ currentIndex: 0 });
        const { rerender } = render(<Lightbox {...props} />);
        await settle();

        rerender(
            <Lightbox
                {...props}
                currentIndex={4}
            />
        );
        await advance(FRAME * 4);
        layout.stage.width = 1000;
        fireEvent(window, new Event('resize'));
        await advance(FRAME);

        expect(imagesOnStage().map(([n]) => n)).toContain(1);
        await settle();
        expect(pageOf(1)).toHaveStyle({ display: 'none' });
        expect([4, 5].map((n) => translateX(pageOf(n)))).toEqual([-1000, 0]);
    });

    test('jumping back before the old image finishes sliding off brings it back from where it is', async () => {
        const props = lightboxProps({ currentIndex: 0 });
        const { rerender } = render(<Lightbox {...props} />);
        await settle();

        rerender(
            <Lightbox
                {...props}
                currentIndex={4}
            />
        );
        await advance(FRAME * 4);
        const before = imagesOnStage().find(([n]) => n === 1)?.[1] ?? NaN;
        rerender(
            <Lightbox
                {...props}
                currentIndex={0}
            />
        );
        const offsets: number[] = [];
        for (let frame = 0; frame < 20; frame += 1) {
            await advance(FRAME);
            offsets.push(imagesOnStage().find(([n]) => n === 1)?.[1] ?? NaN);
        }

        expect(before).toBeLessThan(0);
        expect(Math.abs(offsets[0] - before)).toBeLessThan(100);
        expect(offsets.every((x) => x <= 0.5)).toBe(true);
        await settle();
        expect(translateX(pageOf(1))).toBe(0);
        expect(shownImage()).toBe('Image 1');
    });

    test('jumping next to the old image before it finishes sliding off keeps it as the neighbor', async () => {
        const props = lightboxProps({ currentIndex: 0 });
        const { rerender } = render(<Lightbox {...props} />);
        await settle();

        rerender(
            <Lightbox
                {...props}
                currentIndex={4}
            />
        );
        await advance(FRAME * 4);
        rerender(
            <Lightbox
                {...props}
                currentIndex={1}
            />
        );
        await settle();

        expect(shownImage()).toBe('Image 2');
        expect(pageOf(1)).toHaveStyle({ display: 'flex' });
        expect(translateX(pageOf(1))).toBe(-800);
    });

    test('a jump soon after a page change still slides the old image off the far side', async () => {
        const props = lightboxProps({ currentIndex: 0 });
        const { rerender } = render(<Lightbox {...props} />);
        await settle();
        rerender(
            <Lightbox
                {...props}
                currentIndex={1}
            />
        );
        // Image 2 has nearly settled, a few pixels short of the center
        await advance(FRAME * 25);

        rerender(
            <Lightbox
                {...props}
                currentIndex={4}
            />
        );
        const frames: number[][][] = [];
        for (let frame = 0; frame < 30; frame += 1) {
            await advance(FRAME);
            frames.push(imagesOnStage());
        }

        const leaving = frames.map((frame) => frame.find(([n]) => n === 2)?.[1]);
        const arriving = frames.map((frame) => frame.find(([n]) => n === 5)?.[1]);
        // Image 2 only moves left while image 5 comes on from the right, so they never cross
        const shown = leaving.filter((x) => x !== undefined);
        expect(shown.filter((x, k) => k > 0 && x > shown[k - 1])).toEqual([]);
        expect(
            frames.filter((_, k) => leaving[k] !== undefined && arriving[k] !== undefined && leaving[k] >= arriving[k])
        ).toEqual([]);
    });

    test('keeps the shown image still when images added before it move it onto an existing page', async () => {
        const props = lightboxProps({ currentIndex: 2 });
        const { rerender } = render(
            <Lightbox
                {...props}
                currentIndex={0}
                images={props.images.slice(2)}
            />
        );
        await settle();

        rerender(<Lightbox {...props} />);
        const offsets: number[] = [];
        for (let frame = 0; frame < 5; frame += 1) {
            await advance(FRAME);
            offsets.push(translateX(pageOf(3)));
        }

        expect(offsets).toEqual([0, 0, 0, 0, 0]);
    });

    test('a jump that swaps in other images hides the old page instead of sliding one of the new images off', async () => {
        const props = lightboxProps({ currentIndex: 4 });
        const { rerender } = render(<Lightbox {...props} />);
        await settle();

        rerender(
            <Lightbox
                {...props}
                currentIndex={0}
                images={props.images.map(({ src }, index) => ({
                    alt: `Filtered ${index + 1}`,
                    src: src.replace('image', 'filtered'),
                }))}
            />
        );
        const seen = new Set<string | null>();
        for (let frame = 0; frame < 30; frame += 1) {
            await advance(FRAME);
            for (const img of screen.queryAllByRole('img', { hidden: true })) {
                const page = img.closest('.lightbox-image-pager') as HTMLElement;
                if (page.style.display !== 'none' && Math.abs(translateX(page)) < 800) {
                    seen.add(img.getAttribute('alt'));
                }
            }
        }

        expect([...seen]).toEqual(['Filtered 1']);
    });

    test('a jump between two copies of the same image still slides one off and the other on', async () => {
        const props = lightboxProps({ currentIndex: 0 });
        const images = props.images.map((image) => ({ ...image, src: 'same.jpg' }));
        const { rerender } = render(
            <Lightbox
                {...props}
                images={images}
            />
        );
        await settle();

        rerender(
            <Lightbox
                {...props}
                currentIndex={4}
                images={images}
            />
        );
        await advance(FRAME);

        expect(imagesOnStage().map(([n]) => n)).toEqual([1, 5]);
    });

    test('a second page change before the first one ends slides the first image the rest of the way off', async () => {
        const props = lightboxProps({ currentIndex: 0 });
        const { rerender } = render(<Lightbox {...props} />);
        await settle();

        rerender(
            <Lightbox
                {...props}
                currentIndex={1}
            />
        );
        await advance(FRAME * 4);
        const before = imagesOnStage().find(([n]) => n === 1)?.[1];
        rerender(
            <Lightbox
                {...props}
                currentIndex={2}
            />
        );
        await advance(FRAME);
        const after = imagesOnStage().find(([n]) => n === 1)?.[1];

        expect(before).toBeLessThan(0);
        expect(after).toBeDefined();
        expect(after).toBeLessThan(before as number);
        await settle();
        expect(shownImage()).toBe('Image 3');
        expect(pageOf(1)).toHaveStyle({ display: 'none' });
    });

    test('a quick second page change keeps the first image a stage width ahead of the second', async () => {
        const props = lightboxProps({ currentIndex: 0 });
        const { rerender } = render(<Lightbox {...props} />);
        await settle();

        rerender(
            <Lightbox
                {...props}
                currentIndex={1}
            />
        );
        await advance(FRAME * 4);
        rerender(
            <Lightbox
                {...props}
                currentIndex={2}
            />
        );
        const frames: number[][][] = [];
        const gaps: number[] = [];
        for (let frame = 0; frame < 60; frame += 1) {
            await advance(FRAME);
            frames.push(imagesOnStage());
            if ([1, 2].every((n) => pageOf(n).style.display !== 'none')) {
                gaps.push(translateX(pageOf(1)) - translateX(pageOf(2)));
            }
        }

        expect(gaps.length).toBeGreaterThan(0);
        // jsdom keeps six significant digits of a transform
        expect(gaps.filter((gap) => Math.abs(gap + 800) > 0.01)).toEqual([]);
        expect(frames.filter((frame) => frame.length > 2)).toEqual([]);
    });

    test('a jump soon after a page change keeps the two images that leave a stage width apart', async () => {
        const props = lightboxProps({ currentIndex: 0 });
        const { rerender } = render(<Lightbox {...props} />);
        await settle();

        rerender(
            <Lightbox
                {...props}
                currentIndex={1}
            />
        );
        await advance(FRAME * 4);
        rerender(
            <Lightbox
                {...props}
                currentIndex={4}
            />
        );
        const gaps: number[] = [];
        for (let frame = 0; frame < 60; frame += 1) {
            await advance(FRAME);
            if ([1, 2].every((n) => pageOf(n).style.display !== 'none')) {
                gaps.push(translateX(pageOf(1)) - translateX(pageOf(2)));
            }
        }

        expect(gaps.length).toBeGreaterThan(0);
        // jsdom keeps six significant digits of a transform
        expect(gaps.filter((gap) => Math.abs(gap + 800) > 0.01)).toEqual([]);
    });

    test('a jump right after a step back hides the old image behind it instead of sliding it under the new one', async () => {
        const props = lightboxProps({ currentIndex: 2 });
        const { rerender } = render(<Lightbox {...props} />);
        await settle();

        rerender(
            <Lightbox
                {...props}
                currentIndex={1}
            />
        );
        await advance(FRAME * 4);
        rerender(
            <Lightbox
                {...props}
                currentIndex={4}
            />
        );
        const frames: number[][][] = [];
        for (let frame = 0; frame < 60; frame += 1) {
            await advance(FRAME);
            frames.push(imagesOnStage());
        }

        expect(frames.filter((frame) => frame.length > 2)).toEqual([]);
        await settle();
        expect(shownImage()).toBe('Image 5');
    });
});

describe('page layout', () => {
    test('lines pages up a stage width apart, showing only the current image and its neighbours', async () => {
        await openGallery();

        expect([2, 3, 4].map((n) => translateX(pageOf(n)))).toEqual([-800, 0, 800]);
        [2, 3, 4].forEach((n) => expect(pageOf(n)).toHaveStyle({ display: 'flex' }));
        [1, 5].forEach((n) => expect(pageOf(n)).toHaveStyle({ display: 'none' }));
    });

    test.each(['resize', 'orientationchange'])('lays the pages out again on window %s', async (eventType) => {
        await openGallery();

        layout.stage.width = 1000;
        fireEvent(window, new Event(eventType));
        await settle();

        expect(translateX(pageOf(2))).toBe(-1000);
        expect(translateX(pageOf(4))).toBe(1000);
    });

    test('a wider window puts the images beside the current one in their new places at once', async () => {
        await openGallery();

        layout.stage.width = 1000;
        fireEvent(window, new Event('resize'));
        await advance(FRAME);

        expect(translateX(pageOf(2))).toBe(-1000);
        expect(translateX(pageOf(3))).toBe(0);
        expect(translateX(pageOf(4))).toBe(1000);
    });

    test('fits images to the stage height, minus 50px of room for controls', () => {
        render(<Lightbox {...lightboxProps()} />);

        expect(image(1)).toHaveStyle({ maxHeight: '550px' });
    });

    test('keeps paging when images are added or removed', async () => {
        const props = lightboxProps({ currentIndex: 2 });
        const { rerender } = render(
            <Lightbox
                {...props}
                images={props.images.slice(0, 3)}
            />
        );
        await settle();
        expect(screen.queryByAltText('Image 4')).not.toBeInTheDocument();

        rerender(<Lightbox {...props} />);
        await settle();
        expect(translateX(pageOf(4))).toBe(800);
        await touchscreen.swipe(image(3), SHORT_LEFT);
        expect(props.onNext).toHaveBeenCalledTimes(1);

        rerender(
            <Lightbox
                {...props}
                currentIndex={1}
                images={props.images.slice(0, 2)}
            />
        );
        await settle();
        expect(screen.getAllByRole('img', { hidden: true })).toHaveLength(2);
        expect(shownImage()).toBe('Image 2');
    });
});
