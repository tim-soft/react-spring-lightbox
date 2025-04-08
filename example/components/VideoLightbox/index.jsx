import * as React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Lightbox from 'react-spring-lightbox';
import LightboxArrowButton from '../GalleryLightbox/components/LightboxArrowButton';
import LightboxHeader from '../GalleryLightbox/components/LightboxHeader';

const VideoLightbox = ({ galleryTitle, images }) => {
    console.log('VideoLightbox mounted');

    const [currentImageIndex, setCurrentIndex] = React.useState(0);
    const [showVideo, setShowVideo] = React.useState(false);
    const [videoId, setVideoId] = React.useState('');
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [videoDuration, setVideoDuration] = React.useState(0);
    const [lastKnownTime, setLastKnownTime] = React.useState(0);
    const [player, setPlayer] = React.useState(null);

    const canPrev = currentImageIndex > 0;
    const canNext = currentImageIndex + 1 < images.length;

    React.useEffect(() => {
        console.log('Video state changed:', { showVideo, videoId });
        if (images[currentImageIndex].type === 'video') {
            setShowVideo(true);
            setVideoId(images[currentImageIndex].videoId);
        } else {
            setShowVideo(false);
            setVideoId('');
        }
    }, [currentImageIndex, images]);

    const handlePlayerEvent = (event) => {
        if (event.type === 'ready') {
            setPlayer(event.player);
            setVideoDuration(event.player.getDuration());
        }

        if (event.type === 'play') {
            setIsPlaying(true);
            console.log('Video started playing');
        }

        if (event.type === 'pause' || event.type === 'end') {
            setIsPlaying(false);
            const currentTime = event.player.getCurrentTime();
            setLastKnownTime(currentTime);
            const completed = currentTime >= videoDuration;
            console.log(
                'Video ended. Duration watched:',
                currentTime,
                'seconds',
                completed ? '(completed)' : '(incomplete)',
            );
        }

        // Track time updates
        if (event.type === 'timeupdate') {
            setLastKnownTime(event.player.getCurrentTime());
        }
    };

    const logVideoDuration = () => {
        if (showVideo && isPlaying && player) {
            const currentTime = lastKnownTime;
            const completed = currentTime >= videoDuration;
            console.log(
                'Video interrupted. Duration watched:',
                currentTime,
                'seconds',
                completed ? '(completed)' : '(incomplete)',
            );
        }
    };

    const gotoNext = () => {
        if (canNext) {
            logVideoDuration();
            setTimeout(() => {
                setCurrentIndex(currentImageIndex + 1);
            }, 100);
        }
    };

    const gotoPrevious = () => {
        if (canPrev) {
            logVideoDuration();
            setTimeout(() => {
                setCurrentIndex(currentImageIndex - 1);
            }, 100);
        }
    };

    return (
        <Container>
            <Lightbox
                currentIndex={currentImageIndex}
                images={images}
                isOpen
                onNext={gotoNext}
                onPlayerEvent={handlePlayerEvent}
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
