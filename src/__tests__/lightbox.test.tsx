import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import Lightbox from './components/SimpleLightbox';

test('creates portal on render', () => {
    render(<Lightbox />);
    const portalEl = document.body.querySelector('.lightbox-portal');
    expect(portalEl).toBeTruthy();
});

test('renders custom header', () => {
    render(<Lightbox renderHeader={() => <header id="header" />} />);

    const lightboxContainer = document.body.querySelector(
        '.lightbox-container'
    );

    // Lightbox container should have a header and pager body
    expect(lightboxContainer.childElementCount).toBe(2);

    const firstChildIsHeader = lightboxContainer.firstChild.id === 'header';

    expect(firstChildIsHeader).toBe(true);
});

test('renders custom footer', () => {
    render(<Lightbox renderFooter={() => <footer id="footer" />} />);

    const lightboxContainer = document.body.querySelector(
        '.lightbox-container'
    );

    // Lightbox container should have a pager body and footer
    expect(lightboxContainer.childElementCount).toBe(2);

    const lastChildIsFooter = lightboxContainer.lastChild.id === 'footer';

    expect(lastChildIsFooter).toBe(true);
});

test('renders custom prev/next buttons', () => {
    render(
        <Lightbox
            // eslint-disable-next-line jsx-a11y/control-has-associated-label
            renderNextButton={() => <button id="next-button" type="button" />}
            // eslint-disable-next-line jsx-a11y/control-has-associated-label
            renderPrevButton={() => <button id="prev-button" type="button" />}
        />
    );

    const lightboxImageStage = document.body.querySelector(
        '.lightbox-image-stage'
    );

    expect(lightboxImageStage.firstChild.id).toBe('prev-button');
    expect(lightboxImageStage.lastChild.id).toBe('next-button');
});

test('calls onNext() callback on ArrowRight keypress', () => {
    const onNext = jest.fn();
    render(<Lightbox onNext={onNext} />);

    fireEvent.keyDown(document, { code: 39, key: 'ArrowRight' });
    fireEvent.keyUp(document, { code: 39, key: 'ArrowRight' });

    expect(onNext).toHaveBeenCalledTimes(1);
});

test('calls onPrev() callback on ArrowLeft keypress', () => {
    const onPrev = jest.fn();
    render(<Lightbox currentIndex={2} onPrev={onPrev} />);

    fireEvent.keyDown(document, { code: 37, key: 'ArrowLeft' });
    fireEvent.keyUp(document, { code: 37, key: 'ArrowLeft' });

    expect(onPrev).toHaveBeenCalledTimes(1);
});

test('calls onClose() callback on Esc keypress', () => {
    const onClose = jest.fn();
    render(<Lightbox onClose={onClose} />);

    fireEvent.keyDown(document, { code: 27, key: 'Escape' });
    fireEvent.keyUp(document, { code: 27, key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
});
