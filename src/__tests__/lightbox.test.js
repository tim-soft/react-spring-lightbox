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

  const lightboxContainer = document.body.querySelector('.lightbox-container');

  // Lightbox container should have a header and pager body
  expect(lightboxContainer.childElementCount).toBe(2);

  const firstChildIsHeader = lightboxContainer.firstChild.id === 'header';

  expect(firstChildIsHeader).toBe(true);
});

test('renders custom footer', () => {
  render(<Lightbox renderFooter={() => <footer id="footer" />} />);

  const lightboxContainer = document.body.querySelector('.lightbox-container');

  // Lightbox container should have a pager body and footer
  expect(lightboxContainer.childElementCount).toBe(2);

  const lastChildIsFooter = lightboxContainer.lastChild.id === 'footer';

  expect(lastChildIsFooter).toBe(true);
});

test('renders custom prev/next buttons', () => {
  render(
    <Lightbox
      renderPrevButton={() => <button id="prev-button" type="button" />}
      renderNextButton={() => <button id="next-button" type="button" />}
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

  fireEvent.keyDown(document, { key: 'ArrowRight', code: 39 });
  fireEvent.keyUp(document, { key: 'ArrowRight', code: 39 });

  expect(onNext).toHaveBeenCalledTimes(1);
});

test('calls onPrev() callback on ArrowLeft keypress', () => {
  const onPrev = jest.fn();
  render(<Lightbox onPrev={onPrev} currentIndex={2} />);

  fireEvent.keyDown(document, { key: 'ArrowLeft', code: 37 });
  fireEvent.keyUp(document, { key: 'ArrowLeft', code: 37 });

  expect(onPrev).toHaveBeenCalledTimes(1);
});

test('calls onClose() callback on Esc keypress', () => {
  const onClose = jest.fn();
  render(<Lightbox onClose={onClose} />);

  fireEvent.keyDown(document, { key: 'Escape', code: 27 });
  fireEvent.keyUp(document, { key: 'Escape', code: 27 });

  expect(onClose).toHaveBeenCalledTimes(1);
});
