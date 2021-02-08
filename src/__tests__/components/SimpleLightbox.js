import React, { useState } from 'react';
import Lightbox from '../../index';

const images = [
    {
        src:
            'https://timellenberger.com/static/blog-content/dark-mode/win10-dark-mode.jpg',
        alt: 'Windows 10 Dark Mode Setting',
    },
    {
        src:
            'https://timellenberger.com/static/blog-content/dark-mode/macos-dark-mode.png',
        alt: 'macOS Mojave Dark Mode Setting',
    },
    {
        src:
            'https://timellenberger.com/static/blog-content/dark-mode/android-9-dark-mode.jpg',
        alt: 'Android 9.0 Dark Mode Setting',
    },
];

const SimpleLightbox = (props) => {
    const [currentImageIndex, setCurrentIndex] = useState(0);

    const gotoPrevious = () =>
        currentImageIndex > 0 && setCurrentIndex(currentImageIndex - 1);

    const gotoNext = () =>
        currentImageIndex + 1 < images.length &&
        setCurrentIndex(currentImageIndex + 1);

    return (
        <Lightbox
            isOpen
            images={images}
            onPrev={gotoPrevious}
            onNext={gotoNext}
            currentIndex={currentImageIndex}
            {...props}
        />
    );
};

export default SimpleLightbox;
