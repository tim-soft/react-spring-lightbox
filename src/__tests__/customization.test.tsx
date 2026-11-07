import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, expect, test } from 'vitest';
import Lightbox from '../index';
import type { ImagesListType } from '../index';
import {
    image,
    lightboxContainer,
    lightboxProps,
    mockLayout,
    pageOf,
} from './helpers';

beforeEach(() => {
    mockLayout();
});

test('renders the header above the images and the footer below them', () => {
    render(
        <Lightbox
            {...lightboxProps({
                renderFooter: () => <footer>Footer</footer>,
                renderHeader: () => <header>Header</header>,
            })}
        />,
    );

    const [header, stage, footer] = Array.from(lightboxContainer().children);
    expect(header).toHaveTextContent('Header');
    expect(stage).toBe(screen.getByTestId('lightbox-image-stage'));
    expect(footer).toHaveTextContent('Footer');
});

test('renders the previous and next buttons on either side of the images', () => {
    render(
        <Lightbox
            {...lightboxProps({
                renderNextButton: () => <button type="button">Next</button>,
                renderPrevButton: () => <button type="button">Previous</button>,
            })}
        />,
    );

    const [previous, pager, next] = Array.from(
        screen.getByTestId('lightbox-image-stage').children,
    );
    expect(previous).toHaveTextContent('Previous');
    expect(pager).toContainElement(image(1));
    expect(next).toHaveTextContent('Next');
});

test('renders the image overlay with every image', () => {
    render(
        <Lightbox
            {...lightboxProps({
                renderImageOverlay: () => <div data-testid="overlay" />,
            })}
        />,
    );

    expect(screen.getAllByTestId('overlay')).toHaveLength(5);
    expect(within(pageOf(1)).getByTestId('overlay')).toBeInTheDocument();
});

test('applies className and style to the root container, over its defaults', () => {
    render(
        <Lightbox
            {...lightboxProps({
                className: 'cool-class',
                style: { background: 'grey', zIndex: 1000 },
            })}
        />,
    );

    expect(lightboxContainer()).toHaveClass('lightbox-container', 'cool-class');
    expect(lightboxContainer()).toHaveStyle({
        backgroundColor: 'rgb(128, 128, 128)',
        zIndex: '1000',
    });
});

test('passes image props through to each image element', () => {
    render(
        <Lightbox
            {...lightboxProps({
                images: [
                    {
                        alt: 'Custom',
                        'aria-describedby': 'caption',
                        loading: 'lazy',
                        src: 'custom.jpg',
                        srcSet: 'custom-2x.jpg 2x',
                        style: { borderRadius: '4px' },
                    },
                ],
            })}
        />,
    );

    const custom = screen.getByAltText('Custom');
    expect(custom).toHaveAttribute('src', 'custom.jpg');
    expect(custom).toHaveAttribute('srcset', 'custom-2x.jpg 2x');
    expect(custom).toHaveAttribute('loading', 'lazy');
    expect(custom).toHaveAttribute('aria-describedby', 'caption');
    expect(custom).toHaveAttribute('draggable', 'false');
    expect(custom).toHaveStyle({
        borderRadius: '4px',
        transform: 'translate(0px, 0px) scale(1)',
    });
});

test('stops the browser from dragging an image out of the page', () => {
    render(<Lightbox {...lightboxProps()} />);

    expect(fireEvent.dragStart(image(1))).toBe(false);
});

test('renders no images when the images prop is left out', () => {
    render(
        <Lightbox
            {...lightboxProps({ inline: true })}
            images={undefined as unknown as ImagesListType}
        />,
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
});
