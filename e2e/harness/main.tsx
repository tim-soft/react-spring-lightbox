import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';

import type { ImagesListType } from '../../src/index';

import Lightbox from '../../src/index';

// Each test opens this page with query flags that pick a setup, such as
// ?index=2&singleClickToZoom. The parent below owns currentIndex and
// isOpen, like the README and the example app.
const params = new URLSearchParams(window.location.search);
const flag = (name: string) => params.has(name);

// A styled scrollbar takes up space in Chromium and WebKit, as classic scrollbars on Windows and Linux do
if (flag('classicScrollbar')) {
    const style = document.createElement('style');
    style.textContent = '::-webkit-scrollbar { width: 15px; } ::-webkit-scrollbar-thumb { background: #888; }';
    document.head.append(style);
}

const images: ImagesListType = flag('variety')
    ? [
          { alt: 'Tiny image', src: '/images/tiny.svg' },
          { alt: 'Panorama', src: '/images/panorama.svg' },
          { alt: 'Portrait', src: '/images/2.svg' },
          { alt: 'Broken image', src: '/images/missing.svg' },
          { alt: 'Image 1', src: '/images/1.svg' },
      ]
    : [1, 2, 3, 4, 5].map((n) => ({
          alt: `Image ${n}`,
          src: `/images/${n}.svg`,
          ...(flag('lazy') ? { loading: 'lazy' as const } : {}),
      }));

/** How often the lightbox called each callback, for tests to read */
const calls = { onClose: 0, onNext: 0, onPrev: 0 };
Object.assign(window, { lightboxCalls: calls });

const arrowStyle = (side: 'left' | 'right'): React.CSSProperties =>
    flag('plainButtons')
        ? {}
        : {
              position: 'absolute',
              [side]: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1,
          };

const App = () => {
    const [currentIndex, setCurrentIndex] = useState(Number(params.get('index') ?? 0));
    const [isOpen, setIsOpen] = useState(!flag('closed'));
    const [menuIsOpen, setMenuIsOpen] = useState(false);

    const open = (index: number) => {
        setCurrentIndex(index);
        setIsOpen(true);
    };
    const close = () => {
        calls.onClose += 1;
        setIsOpen(false);
    };
    const gotoNext = () => {
        calls.onNext += 1;
        setCurrentIndex((index) => Math.min(index + 1, images.length - 1));
    };
    const gotoPrevious = () => {
        calls.onPrev += 1;
        setCurrentIndex((index) => Math.max(index - 1, 0));
    };

    const lightbox = (
        <Lightbox
            aria-label="Image gallery"
            currentIndex={currentIndex}
            images={images}
            inline={flag('inline')}
            isOpen={isOpen}
            onClose={close}
            onNext={gotoNext}
            onPrev={gotoPrevious}
            renderFooter={() => (
                <footer style={{ color: 'white', padding: 8 }}>
                    {flag('footerInput') ? (
                        <input
                            aria-label="Caption"
                            defaultValue="A caption"
                        />
                    ) : (
                        `Caption for image ${currentIndex + 1}`
                    )}
                </footer>
            )}
            renderHeader={() => (
                <header style={{ color: 'white', display: 'flex', padding: 8 }}>
                    <span style={{ flex: 1 }}>
                        {currentIndex + 1} / {images.length}
                    </span>
                    {flag('portalMenu') && (
                        <button
                            onClick={() => setMenuIsOpen(true)}
                            type="button"
                        >
                            Menu
                        </button>
                    )}
                    <button
                        onClick={close}
                        type="button"
                    >
                        Close
                    </button>
                </header>
            )}
            renderImageOverlay={() =>
                flag('overlay') ? (
                    <button
                        onClick={() => {
                            document.title = 'Shared';
                        }}
                        style={{ position: 'absolute', right: 0, top: 0 }}
                        type="button"
                    >
                        Share
                    </button>
                ) : null
            }
            renderNextButton={({ canNext }) => (
                <button
                    disabled={!canNext}
                    onClick={gotoNext}
                    style={arrowStyle('right')}
                    type="button"
                >
                    Next
                </button>
            )}
            renderPrevButton={({ canPrev }) => (
                <button
                    disabled={!canPrev}
                    onClick={gotoPrevious}
                    style={arrowStyle('left')}
                    type="button"
                >
                    Previous
                </button>
            )}
            singleClickToZoom={flag('singleClickToZoom')}
            style={{ background: 'rgba(0, 0, 0, 0.9)' }}
        />
    );

    if (flag('inline')) {
        return (
            <main>
                <p style={{ height: 600, margin: 0 }}>Above the carousel</p>
                <div
                    data-testid="carousel"
                    style={{ height: 400 }}
                >
                    {lightbox}
                </div>
                <p style={{ height: 1200, margin: 0 }}>Below the carousel</p>
            </main>
        );
    }

    return (
        <main>
            <h1>Gallery</h1>
            {images.map(({ alt }, index) => (
                <button
                    key={alt}
                    onClick={() => open(index)}
                    type="button"
                >
                    Open {alt}
                </button>
            ))}
            <p style={{ height: 2000 }}>A long page behind the lightbox</p>
            <button
                onClick={() => open(0)}
                type="button"
            >
                View the first image from the bottom of the page
            </button>
            {menuIsOpen &&
                createPortal(
                    <button
                        onClick={() => {
                            document.title = 'Picked';
                        }}
                        style={{ left: 0, position: 'fixed', top: 80, zIndex: 500 }}
                        type="button"
                    >
                        Portaled item
                    </button>,
                    document.body
                )}
            {/* A transform traps position: fixed elements inside it */}
            <div style={flag('insideTransform') ? { transform: 'translateZ(0)' } : undefined}>{lightbox}</div>
        </main>
    );
};

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
