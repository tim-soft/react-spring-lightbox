import PropTypes from 'prop-types';
import * as React from 'react';
import Lightbox from 'react-spring-lightbox';

import LightboxArrowButton from '../GalleryLightbox/components/LightboxArrowButton';

const InlineLightbox = ({ images }) => {
    const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
    const inlineCarouselElement = React.useRef();

    const preventWheel = (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };

    React.useEffect(() => {
        const element = inlineCarouselElement.current;
        element?.addEventListener('wheel', preventWheel);

        // oxlint-disable-next-line react/set-state-in-effect -- goes back to the first image when the demo swaps in new images
        setCurrentImageIndex(0);

        return () => element?.removeEventListener('wheel', preventWheel);
    }, [inlineCarouselElement, images]);

    const canPrev = currentImageIndex > 0;
    const canNext = currentImageIndex + 1 < images.length;

    const gotoNext = () => {
        canNext ? setCurrentImageIndex(currentImageIndex + 1) : () => null;
    };

    const gotoPrevious = () => {
        canPrev ? setCurrentImageIndex(currentImageIndex - 1) : null;
    };

    return (
        <div
            className="inline-flex h-[384px] w-full flex-col overflow-hidden"
            ref={inlineCarouselElement}
        >
            <Lightbox
                currentIndex={currentImageIndex}
                images={images}
                inline
                isOpen
                onNext={gotoNext}
                onPrev={gotoPrevious}
                renderNextButton={({ canNext }) => (
                    <LightboxArrowButton
                        className="z-10 [&_button]:text-[25px]"
                        disabled={!canNext}
                        onClick={gotoNext}
                        position="right"
                    />
                )}
                renderPrevButton={({ canPrev }) => (
                    <LightboxArrowButton
                        className="z-10 [&_button]:text-[25px]"
                        disabled={!canPrev}
                        onClick={gotoPrevious}
                        position="left"
                    />
                )}
                singleClickToZoom
            />
        </div>
    );
};

export default InlineLightbox;

InlineLightbox.propTypes = {
    images: PropTypes.arrayOf(
        PropTypes.shape({
            alt: PropTypes.string.isRequired,
            caption: PropTypes.string.isRequired,
            height: PropTypes.number,
            src: PropTypes.string.isRequired,
            width: PropTypes.number,
        })
    ).isRequired,
};
