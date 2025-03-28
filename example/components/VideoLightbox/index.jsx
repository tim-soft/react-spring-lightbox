import * as React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Lightbox from 'react-spring-lightbox';
import LightboxArrowButton from '../GalleryLightbox/components/LightboxArrowButton';
import LightboxHeader from '../GalleryLightbox/components/LightboxHeader';

const VideoLightbox = ({ description, galleryTitle, images }) => {
    const [currentImageIndex, setCurrentIndex] = React.useState(0);
    const [showVideo, setShowVideo] = React.useState(false);
    const [videoId, setVideoId] = React.useState('');

    const canPrev = currentImageIndex > 0;
    const canNext = currentImageIndex + 1 < images.length;

    const gotoNext = () => {
        if (canNext) {
            setCurrentIndex(currentImageIndex + 1);
            // If next item is a video, show it
            if (images[currentImageIndex + 1].type === 'video') {
                setShowVideo(true);
                setVideoId(images[currentImageIndex + 1].videoId);
            } else {
                setShowVideo(false);
            }
        }
    };

    const gotoPrevious = () => {
        if (canPrev) {
            setCurrentIndex(currentImageIndex - 1);
            // If previous item is a video, show it
            if (images[currentImageIndex - 1].type === 'video') {
                setShowVideo(true);
                setVideoId(images[currentImageIndex - 1].videoId);
            } else {
                setShowVideo(false);
            }
        }
    };

    // Handle video button click
    const handleVideoClick = () => {
        if (images[currentImageIndex].type === 'video') {
            setShowVideo(true);
            setVideoId(images[currentImageIndex].videoId);
        }
    };

    return (
        <Container>
            <Lightbox
                currentIndex={currentImageIndex}
                description={description}
                galleryTitle={galleryTitle}
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
            {!showVideo && images[currentImageIndex].type === 'video' && (
                <VideoButton onClick={handleVideoClick}>Play Video</VideoButton>
            )}
        </Container>
    );
};

export default VideoLightbox;

VideoLightbox.propTypes = {
    description: PropTypes.string,
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

const VideoButton = styled.button`
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    transition: background 0.2s;

    &:hover {
        background: rgba(0, 0, 0, 0.9);
    }
`;
