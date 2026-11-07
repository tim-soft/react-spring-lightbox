import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
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

let layout: ReturnType<typeof mockLayout>;

beforeEach(() => {
    layout = mockLayout();
});

const openGallery = async (initialIndex = START) => {
    render(<Gallery initialIndex={initialIndex} />);
    await settle();
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

    test.fails('one trackpad swipe pages one image (#52)', async () => {
        const props = lightboxProps({ currentIndex: START });
        render(<Lightbox {...props} />);

        await trackpad.scroll(pageOf(3), { deltaX: -600, ticks: 6 });

        expect(props.onNext).toHaveBeenCalledTimes(1);
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

    test.fails('leaves arrow keys to a text field inside the lightbox (#65)', () => {
        const props = lightboxProps({
            currentIndex: START,
            renderFooter: () => <input aria-label="Caption" />,
        });
        render(<Lightbox {...props} />);

        pressKey('ArrowRight', screen.getByRole('textbox', { name: 'Caption' }));

        expect(props.onNext).not.toHaveBeenCalled();
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
