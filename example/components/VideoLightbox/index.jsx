import * as React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Lightbox from 'react-spring-lightbox';
import LightboxArrowButton from '../GalleryLightbox/components/LightboxArrowButton';
import LightboxHeader from '../GalleryLightbox/components/LightboxHeader';

const VideoLightbox = ({ galleryTitle, images }) => {
    const [currentImageIndex, setCurrentIndex] = React.useState(0);
    const [showVideo, setShowVideo] = React.useState(false);
    const [videoId, setVideoId] = React.useState('');

    const canPrev = currentImageIndex > 0;
    const canNext = currentImageIndex + 1 < images.length;

    React.useEffect(() => {
        if (images[currentImageIndex].type === 'video') {
            setShowVideo(true);
            setVideoId(images[currentImageIndex].videoId);
        } else {
            setShowVideo(false);
            setVideoId('');
        }
    }, [currentImageIndex, images]);

    const gotoNext = () => {
        if (canNext) {
            setCurrentIndex(currentImageIndex + 1);
        }
    };

    const gotoPrevious = () => {
        if (canPrev) {
            setCurrentIndex(currentImageIndex - 1);
        }
    };

    return (
        <Container>
            <Lightbox
                currentIndex={currentImageIndex}
                images={images}
                isOpen
                onNext={gotoNext}
                onPrev={gotoPrevious}
                renderHeader={() => (
                    <LightboxHeader
                        currentIndex={currentImageIndex}
                        galleryTitle={galleryTitle}
                        images={images}
                        onClose={() => {}}
                    />
                )}
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
                showVideo={showVideo}
                singleClickToZoom
                videoId={videoId}
            />
        </Container>
    );
};

export default VideoLightbox;

VideoLightbox.propTypes = {
    galleryTitle: PropTypes.string,
    images: PropTypes.arrayOf(
        PropTypes.shape({
            alt: PropTypes.string.isRequired,
            caption: PropTypes.string,
            src: PropTypes.string.isRequired,
            type: PropTypes.oneOf(['image', 'video']),
            videoId: PropTypes.string,
        }),
    ).isRequired,
};

const Container = styled.div`
    display: inline-flex;
    flex-direction: column;
    width: 100%;
    height: 384px;
    overflow: hidden;
    position: relative;
`;

const StyledLightboxArrowButton = styled(LightboxArrowButton)`
    z-index: 10;
    button {
        font-size: 25px;
    }
`;
