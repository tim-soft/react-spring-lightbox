// perf/vite.config.mts points this at the src/ of the variant being measured
import Lightbox from 'perf-lightbox';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

import type { ImagesListType } from '../../src/index';

// ?images=100&index=50&closed opens on image 51 of 100 when the Open button is
// clicked. The parent passes new callbacks on every render, as in the README.
const params = new URLSearchParams(window.location.search);
const count = Number(params.get('images') ?? 5);
const extension = params.get('format') ?? 'svg';

// elementtiming reports when each image first paints, for perf/run.mjs to read
const images = Array.from({ length: count }, (_, i) => ({
    alt: `Image ${i + 1}`,
    elementtiming: `image-${i + 1}`,
    src: `/img/${i + 1}.${extension}`,
    ...(params.has('lazy') ? { loading: 'lazy' as const } : {}),
})) as ImagesListType;

const App = () => {
    const [currentIndex, setCurrentIndex] = useState(Number(params.get('index') ?? 0));
    const [isOpen, setIsOpen] = useState(!params.has('closed'));

    const gotoPrevious = () => currentIndex > 0 && setCurrentIndex(currentIndex - 1);
    const gotoNext = () => currentIndex + 1 < images.length && setCurrentIndex(currentIndex + 1);

    return (
        <main>
            <button
                onClick={() => setIsOpen(true)}
                type="button"
            >
                Open
            </button>
            <Lightbox
                currentIndex={currentIndex}
                images={images}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onNext={gotoNext}
                onPrev={gotoPrevious}
                renderFooter={() => (
                    <footer style={{ color: 'white', padding: 8 }}>
                        {currentIndex + 1} / {images.length}
                    </footer>
                )}
                renderHeader={() => (
                    <header style={{ color: 'white', padding: 8 }}>
                        <button
                            onClick={() => setIsOpen(false)}
                            type="button"
                        >
                            Close
                        </button>
                    </header>
                )}
                style={{ background: 'rgba(0, 0, 0, 0.9)' }}
            />
        </main>
    );
};

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
