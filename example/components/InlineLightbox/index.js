import * as React from 'react';
import styled from 'styled-components';
import Lightbox from 'react-spring-lightbox';
import LightboxArrowButton from '../GalleryLightbox/components/LightboxArrowButton';

const images = [
    {
        alt: 'Windows 10 Dark Mode Setting',
        caption: 'Windows 10 Dark Mode Setting',
        height: 2035,
        src: 'https://timellenberger.com/static/blog-content/dark-mode/win10-dark-mode.jpg',
        width: 2848,
    },
    {
        alt: 'macOS Mojave Dark Mode Setting',
        caption: 'macOS Mojave Dark Mode Setting',
        height: 1218,
        src: 'https://timellenberger.com/static/blog-content/dark-mode/macos-dark-mode.png',
        width: 1200,
    },
    {
        alt: 'Android 9.0 Dark Mode Setting',
        caption: 'Android 9.0 Dark Mode Setting',
        height: 600,
        src: 'https://timellenberger.com/static/blog-content/dark-mode/android-9-dark-mode.jpg',
        width: 1280,
    },
    {
        alt: 'Windows 10 Dark Mode Setting#',
        caption: 'Windows 10 Dark Mode Setting#',
        height: 2035,
        src: 'https://timellenberger.com/static/blog-content/dark-mode/win10-dark-mode.jpg',
        width: 2848,
    },
    {
        alt: 'Windows 10 Dark Mode Setting',
        caption: 'Windows 10 Dark Mode Setting',
        height: 2035,
        src: 'https://timellenberger.com/static/blog-content/dark-mode/win10-dark-mode.jpg',
        width: 2848,
    },
    {
        alt: 'macOS Mojave Dark Mode Setting',
        caption: 'macOS Mojave Dark Mode Setting',
        height: 1218,
        src: 'https://timellenberger.com/static/blog-content/dark-mode/macos-dark-mode.png',
        width: 1200,
    },
    {
        alt: 'Android 9.0 Dark Mode Setting',
        caption: 'Android 9.0 Dark Mode Setting',
        height: 600,
        src: 'https://timellenberger.com/static/blog-content/dark-mode/android-9-dark-mode.jpg',
        width: 1280,
    },
    {
        alt: 'Windows 10 Dark Mode Setting#',
        caption: 'Windows 10 Dark Mode Setting#',
        height: 2035,
        src: 'https://timellenberger.com/static/blog-content/dark-mode/win10-dark-mode.jpg',
        width: 2848,
    },
    {
        alt: 'Android 9.0 Dark Mode Setting',
        caption: 'Android 9.0 Dark Mode Setting',
        height: 600,
        src: 'https://timellenberger.com/static/blog-content/dark-mode/android-9-dark-mode.jpg',
        width: 1280,
    },
    {
        alt: 'Windows 10 Dark Mode Setting#',
        caption: 'Windows 10 Dark Mode Setting#',
        height: 2035,
        src: 'https://timellenberger.com/static/blog-content/dark-mode/win10-dark-mode.jpg',
        width: 2848,
    },
];

const InlineLightbox = () => {
    // const getRandomImages = async () => {
    //     // const response = await fetch('https://picsum.photos/id/237/200/300');
    //     const response = await fetch('https://picsum.photos/v2/list?limit=10');
    //     console.log(response);

    //     return response;
    // };

    // const imageUrl = 'https://picsum.photos/200/300';

    // const reader = new FileReader();
    // reader.onloadend = () => {
    //     const base64data = reader.result;
    //     console.log(base64data);
    // };

    // console.log(
    //     (async () => {
    //         const response = await fetch(imageUrl);
    //         const imageBlob = await response.blob();
    //         reader.readAsDataURL(imageBlob);
    //     })()
    // );

    // const images = getRandomImages();
    // console.log({ images });
    const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
    const [mounted, setMounted] = React.useState(false);

    const inlineCarouselElement = React.useRef();

    React.useEffect(() => {
        setMounted(true);
        inlineCarouselElement?.current?.addEventListener('wheel', preventWheel);
    }, [inlineCarouselElement]);

    const preventWheel = (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };

    const canPrev = currentImageIndex > 0;
    const canNext = currentImageIndex + 1 < images.length;

    const gotoNext = () => {
        canNext ? setCurrentImageIndex(currentImageIndex + 1) : () => null;
    };

    const gotoPrevious = () => {
        canPrev ? setCurrentImageIndex(currentImageIndex - 1) : null;
    };

    if (typeof window === 'undefined') {
        return null;
    }

    return (
        mounted && (
            <Container ref={inlineCarouselElement}>
                <Lightbox
                    currentIndex={currentImageIndex}
                    images={images}
                    inline
                    isOpen
                    onNext={gotoNext}
                    onPrev={gotoPrevious}
                    renderNextButton={({ canNext }) => (
                        <StyledLightboxArrowButton
                            disabled={!canNext}
                            onClick={gotoNext}
                            position="right"
                        />
                    )}
                    renderPrevButton={({ canPrev }) => (
                        <StyledLightboxArrowButton
                            disabled={!canPrev}
                            onClick={gotoPrevious}
                            position="left"
                        />
                    )}
                    singleClickToZoom
                />
            </Container>
        )
    );
};

export default InlineLightbox;

const Container = styled.div`
    display: inline-flex;
    flex-direction: column;
    width: 100%;
    height: 384px;
    overflow: hidden;
`;

const StyledLightboxArrowButton = styled(LightboxArrowButton)`
    z-index: 10;
    button {
        font-size: 25px;
    }
`;
