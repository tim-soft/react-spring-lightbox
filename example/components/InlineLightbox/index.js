import * as React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Lightbox from 'react-spring-lightbox';
import LightboxArrowButton from '../GalleryLightbox/components/LightboxArrowButton';

const InlineLightbox = ({ images }) => {
    const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
    const [mounted, setMounted] = React.useState(false);

    const inlineCarouselElement = React.useRef();

    React.useEffect(() => {
        setMounted(true);
        inlineCarouselElement?.current?.addEventListener('wheel', preventWheel);

        setCurrentImageIndex(0);
    }, [inlineCarouselElement, images]);

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
