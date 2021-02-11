import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import Lightbox from './components/SimpleLightbox';

describe('Lightbox', () => {
    describe('CreatePortal', () => {
        test('creates portal on render', () => {
            render(<Lightbox />);
            const portalEl = document.body.querySelector('.lightbox-portal');
            expect(portalEl).toBeTruthy();
        });
    });

    describe('renderHeader', () => {
        test('renders custom header', () => {
            render(
                <Lightbox
                    renderHeader={() => <header data-testid="header" />}
                />
            );

            const lightboxContainer = screen.getByTestId('lightbox-container');
            const lightboxHeader = screen.getByTestId('header');

            // Lightbox container should have a header and pager body
            expect(lightboxContainer.childElementCount).toBe(2);
            expect(lightboxContainer).toBeInTheDocument();

            // Header exists in the lightbox
            expect(lightboxHeader).toBeInTheDocument();
        });
    });

    describe('renderFooter', () => {
        test('renders custom footer', () => {
            render(
                <Lightbox
                    renderFooter={() => <footer data-testid="footer" />}
                />
            );

            const lightboxContainer = screen.getByTestId('lightbox-container');
            const lightboxFooter = screen.getByTestId('footer');

            // Lightbox container exists and should have a pager body and footer
            expect(lightboxContainer.childElementCount).toBe(2);
            expect(lightboxContainer).toBeInTheDocument();

            // Footer exists in the lightbox
            expect(lightboxFooter).toBeInTheDocument();
        });
    });

    describe('renderNextButton/renderPrevButton', () => {
        test('renders custom prev/next buttons', () => {
            render(
                <Lightbox
                    // eslint-disable-next-line jsx-a11y/control-has-associated-label
                    renderNextButton={() => (
                        <button data-testid="next-button" type="button" />
                    )}
                    // eslint-disable-next-line jsx-a11y/control-has-associated-label
                    renderPrevButton={() => (
                        <button data-testid="prev-button" type="button" />
                    )}
                />
            );

            const prevButton = screen.getByTestId('next-button');
            const nextButton = screen.getByTestId('prev-button');

            expect(prevButton).toBeInTheDocument();
            expect(nextButton).toBeInTheDocument();
        });
    });

    describe('keyboard shortcuts', () => {
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
    });
});
