import React, { useState } from 'react';
import Lightbox, { ImagesListType } from '../../index';

const images: ImagesListType = [
    {
        alt: 'Windows 10 Dark Mode Setting',
        src:
            'https://timellenberger.com/static/blog-content/dark-mode/win10-dark-mode.jpg',
    },
    {
        alt: 'macOS Mojave Dark Mode Setting',
        src:
            'https://timellenberger.com/static/blog-content/dark-mode/macos-dark-mode.png',
    },
    {
        alt: 'Android 9.0 Dark Mode Setting',
        src:
            'https://timellenberger.com/static/blog-content/dark-mode/android-9-dark-mode.jpg',
    },
];

const SimpleLightbox = (
    props: Partial<React.ComponentProps<typeof Lightbox>>
) => {
    const [currentImageIndex, setCurrentIndex] = useState(0);

    const gotoPrevious = () =>
        currentImageIndex > 0 && setCurrentIndex(currentImageIndex - 1);

    const gotoNext = () =>
        currentImageIndex + 1 < images.length &&
        setCurrentIndex(currentImageIndex + 1);

    return (
        <Lightbox
            currentIndex={currentImageIndex}
            images={images}
            isOpen
            onClose={() => null}
            onNext={gotoNext}
            onPrev={gotoPrevious}
            {...props}
        />
    );
};

export default SimpleLightbox;
