/* eslint-disable no-shadow */
import React from 'react';
import useMeasure from 'react-use-measure';
import { ResizeObserver } from '@juggle/resize-observer';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import ImagePager from './components/ImagePager';

/**
 * Containing element for ImagePager and prev/next button controls
 *
 * @param {array} images Array of image objects to be shown in Lightbox
 * @param {number} currentIndex Index of image in images array that is currently shown
 * @param {function} onPrev True if this image is currently shown in pager, otherwise false
 * @param {function} onNext Function that can be called to disable dragging in the pager
 * @param {function} renderPrevButton A React component that is used for previous button in image pager
 * @param {function} renderNextButton A React component that is used for next button in image pager
 * @param {function} renderImageOverlay A React component that renders inside the image stage, useful for making overlays over the image
 */
const ImageStage = ({
    images,
    currentIndex,
    onPrev,
    onNext,
    onClose,
    renderPrevButton,
    renderNextButton,
    renderImageOverlay
}) => {
    // Get exact height of the image stage, used to make images responsive
    const [containerStageRef, { height }] = useMeasure({
        /**
         * Add resize observer polyfill
         * @see https://github.com/react-spring/react-use-measure/#resize-observer-polyfills
         */
        polyfill: ResizeObserver
    });

    // Extra sanity check that the next/prev image exists before moving to it
    const canPrev = currentIndex > 0;
    const canNext = currentIndex + 1 < images.length;
    const prev = () => canPrev && onPrev();
    const next = () => canNext && onNext();

    return (
        <ImageStageContainer
            className="lightbox-image-stage"
            ref={containerStageRef}
        >
            {renderPrevButton({ canPrev })}
            <ImagePagerContainer ref={containerStageRef}>
                <ImagePager
                    images={images}
                    currentIndex={currentIndex}
                    onClose={onClose}
                    onNext={next}
                    onPrev={prev}
                    renderImageOverlay={renderImageOverlay}
                    pagerHeight={height - 50}
                />
            </ImagePagerContainer>
            {renderNextButton({ canNext })}
        </ImageStageContainer>
    );
};

ImageStage.propTypes = {
    onClose: PropTypes.func.isRequired,
    onPrev: PropTypes.func.isRequired,
    onNext: PropTypes.func.isRequired,
    currentIndex: PropTypes.number.isRequired,
    images: PropTypes.arrayOf(
        PropTypes.shape({
            src: PropTypes.string.isRequired,
            caption: PropTypes.string.isRequired,
            alt: PropTypes.string.isRequired,
            width: PropTypes.number,
            height: PropTypes.number
        })
    ).isRequired,
    renderPrevButton: PropTypes.func.isRequired,
    renderNextButton: PropTypes.func.isRequired,
    renderImageOverlay: PropTypes.func.isRequired
};

export default ImageStage;

const ImagePagerContainer = styled.div`
    height: 100%;
    width: 100%;
`;

const ImageStageContainer = styled.div`
    flex-grow: 1;
    position: relative;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
`;
