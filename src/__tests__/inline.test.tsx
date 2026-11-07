import { render, screen, within } from '@testing-library/react';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { beforeEach, describe, expect, test } from 'vitest';

import Lightbox from '../index';
import { mouse, pressKey, touch, touchscreen, trackpad } from './devices';
import { CENTER, image, lightboxProps, mockLayout, pageOf, settle } from './helpers';

const inlineProps = (currentIndex = 0) => lightboxProps({ currentIndex, inline: true });

describe('before the stage is measured', () => {
    test('shows only the current image', () => {
        render(<Lightbox {...inlineProps(1)} />);

        expect(image(2)).toBeVisible();
        [1, 3, 4, 5].forEach((n) => expect(image(n)).not.toBeVisible());
    });

    test('server-renders every image, showing only the current one', () => {
        const html = renderToString(<Lightbox {...inlineProps(3)} />);
        // oxlint-disable-next-line react/no-danger -- mounts the server-rendered markup to inspect it
        render(<div dangerouslySetInnerHTML={{ __html: html }} />);

        expect(screen.getAllByRole('img', { hidden: true })).toHaveLength(5);
        expect(image(4)).toBeVisible();
        expect(image(1)).not.toBeVisible();
    });
});

describe('once measured', () => {
    beforeEach(() => {
        mockLayout();
    });

    test('renders in place, without a portal or backdrop', () => {
        const { container } = render(<Lightbox {...inlineProps()} />);

        expect(within(container).getByTestId('lightbox-image-stage')).toContainElement(image(1));
        expect(document.querySelector('.lightbox-portal')).toBeNull();
        expect(screen.queryByTestId('lightbox-container')).not.toBeInTheDocument();
    });

    test.each([
        ['a mouse drag', mouse.drag],
        ['a swipe', touchscreen.swipe],
    ])('%s pages', async (_, drag) => {
        const props = inlineProps(2);
        render(<Lightbox {...props} />);

        await drag(pageOf(3), [
            [600, 300],
            [560, 300],
        ]);

        expect(props.onNext).toHaveBeenCalledTimes(1);
    });

    test('lets touches scroll the page vertically over the images', () => {
        render(<Lightbox {...inlineProps()} />);

        expect(pageOf(1)).toHaveStyle({ touchAction: 'pan-y' });
        expect(image(1)).toHaveStyle({ touchAction: 'pan-y' });
    });

    test('ignores the mouse wheel', async () => {
        const props = inlineProps(2);
        render(<Lightbox {...props} />);

        await trackpad.scroll(pageOf(3), { deltaY: 200, ticks: 2 });

        expect(props.onPrev).not.toHaveBeenCalled();
    });

    test.each([
        ['a double click', () => mouse.doubleClick(image(1), CENTER)],
        ['a double tap', () => touchscreen.doubleTap(image(1), CENTER)],
        ['ctrl + wheel', () => trackpad.pinch(image(1), { deltaY: -100 })],
        [
            'spreading two fingers',
            () =>
                touch(
                    image(1),
                    [
                        [462, 384],
                        [562, 384],
                    ],
                    { pointerEvents: false }
                ).moveTo([
                    [412, 384],
                    [612, 384],
                ]),
        ],
    ])('does not zoom on %s', async (_, zoom) => {
        render(<Lightbox {...inlineProps()} />);

        await zoom();
        await settle();

        expect(image(1)).toHaveStyle({
            transform: 'translate(0px, 0px) scale(1)',
        });
    });

    test('fits images to the full stage height', () => {
        render(<Lightbox {...inlineProps()} />);

        expect(image(1)).toHaveStyle({ maxHeight: '600px' });
    });

    test.fails('leaves the keyboard to the page around it (#65)', () => {
        render(<Lightbox {...inlineProps()} />);

        expect(pressKey('ArrowDown')).toBe(true);
        expect(pressKey('PageDown')).toBe(true);
    });
});
