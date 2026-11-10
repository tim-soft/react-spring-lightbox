import type { ComponentProps } from 'react';

import { act, screen } from '@testing-library/react';
import React, { useState } from 'react';
import { vi } from 'vitest';

import type { ImagesListType } from '../index';

import Lightbox from '../index';

export type Point = [x: number, y: number];

type Box = { height: number; left: number; top: number; width: number };

type LightboxProps = ComponentProps<typeof Lightbox>;

/** The center of jsdom's 1024x768 window, and of the mocked image box */
export const CENTER: Point = [512, 384];

/** A point on the stage outside the image */
export const BACKDROP: Point = [100, 100];

const images: ImagesListType = [1, 2, 3, 4, 5].map((n) => ({
    alt: `Image ${n}`,
    src: `image-${n}.jpg`,
}));

/** Props for an open lightbox over five images, with a spy for every callback */
export const lightboxProps = (overrides: Partial<LightboxProps> = {}) => ({
    currentIndex: 0,
    images,
    isOpen: true,
    onClose: vi.fn(),
    onNext: vi.fn(),
    onPrev: vi.fn(),
    ...overrides,
});

/**
 * A parent that owns `currentIndex` and `isOpen` and renders its own close
 * and arrow buttons, as in the README and the example app
 */
export const Gallery = ({
    initialIndex = 0,
    ...props
}: Omit<Partial<LightboxProps>, 'currentIndex' | 'images' | 'isOpen'> & {
    initialIndex?: number;
}) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isOpen, setIsOpen] = useState(true);
    const close = () => setIsOpen(false);
    const gotoNext = () => currentIndex + 1 < images.length && setCurrentIndex(currentIndex + 1);
    const gotoPrevious = () => currentIndex > 0 && setCurrentIndex(currentIndex - 1);

    return (
        <Lightbox
            currentIndex={currentIndex}
            images={images}
            isOpen={isOpen}
            onClose={close}
            onNext={gotoNext}
            onPrev={gotoPrevious}
            renderHeader={() => (
                <button
                    onClick={close}
                    type="button"
                >
                    Close
                </button>
            )}
            renderNextButton={({ canNext }) => (
                <button
                    disabled={!canNext}
                    onClick={gotoNext}
                    type="button"
                >
                    Next
                </button>
            )}
            renderPrevButton={({ canPrev }) => (
                <button
                    disabled={!canPrev}
                    onClick={gotoPrevious}
                    type="button"
                >
                    Previous
                </button>
            )}
            {...props}
        />
    );
};

/** One animation frame at 60fps */
export const FRAME = 16;

/**
 * Runs timers and animation frames for `ms` milliseconds, flushing the
 * promise callbacks react-spring settles animations with along the way
 */
export const advance = (ms: number) =>
    act(async () => {
        await vi.advanceTimersByTimeAsync(ms);
    });

/** Waits for every spring in the lightbox to come to rest */
export const settle = () => advance(1000);

export const image = (n: number) => screen.getByAltText(`Image ${n}`);

/** The pager page (the backdrop around an image) holding image `n` */
export const pageOf = (n: number) => image(n).closest('.lightbox-image-pager') as HTMLElement;

export const lightboxContainer = () => screen.getByTestId('lightbox-container');

const NUMBER = '(-?[\\d.]+(?:e[-+]?\\d+)?)';

/** Pixel offset of an element's `translateX(...)` transform, written in pixels or in percent of its width */
export const translateX = (element: HTMLElement) => {
    const [, value, unit] = new RegExp(`translateX\\(${NUMBER}(px|%)\\)`).exec(element.style.transform) ?? [];
    return unit === '%' ? (Number(value) / 100) * element.clientWidth : Number(value);
};

/** The alt text of the image the pager has centered */
export const shownImage = () =>
    screen
        .queryAllByRole('img', { hidden: true })
        .find((img) => translateX(img.closest('.lightbox-image-pager') as HTMLElement) === 0)
        ?.getAttribute('alt');

/** Scale and translate offsets of an image's `translate(x, y) scale(s)` transform */
export const imageTransform = (element: HTMLElement) => {
    const [, x = '0', y = '0', scale = '1'] =
        new RegExp(`translate\\(${NUMBER}px(?:, ${NUMBER}px)?\\) scale\\(${NUMBER}\\)`).exec(element.style.transform) ??
        [];

    return { scale: Number(scale), x: Number(x), y: Number(y) };
};

/** Opacity and scale of the lightbox's open and close animation */
export const containerAppearance = () => {
    const { opacity, transform } = lightboxContainer().style;
    return {
        opacity: Number(opacity),
        scale: Number(new RegExp(`scale\\(${NUMBER}\\)`).exec(transform)?.[1]),
    };
};

export const toDOMRect = ({ height, left, top, width }: Box) =>
    ({
        bottom: top + height,
        height,
        left,
        right: left + width,
        toJSON: () => ({}),
        top,
        width,
        x: left,
        y: top,
    }) as DOMRect;

/**
 * jsdom has no layout engine. Every element reports the stage size, and every
 * image reports the box in `layout.image` moved and scaled by its current
 * transform. Mutate the returned object to resize either one.
 */
export const mockLayout = () => {
    const layout = {
        // Centered in the window
        image: { height: 400, left: 212, top: 184, width: 600 },
        stage: { height: 600, width: 800 },
    };

    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => layout.stage.width);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => layout.stage.height);
    vi.spyOn(HTMLImageElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLImageElement) {
        const { height, left, top, width } = layout.image;
        const { scale, x, y } = imageTransform(this);

        return toDOMRect({
            height: height * scale,
            left: left + x + (width * (1 - scale)) / 2,
            top: top + y + (height * (1 - scale)) / 2,
            width: width * scale,
        });
    });

    return layout;
};
