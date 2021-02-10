/* eslint-disable no-shadow */
import React from 'react';
import styled from 'styled-components';
import ImagePager from './components/ImagePager';

type IImageStageProps = {
    currentIndex: number;
    images: {
        alt: string;
        caption: string;
        height: number;
        src: string;
        width: number;
    }[];
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
    renderImageOverlay: () => React.ReactNode;
    renderNextButton: ({ canNext }: { canNext: boolean }) => React.ReactNode;
    renderPrevButton: ({ canPrev }: { canPrev: boolean }) => React.ReactNode;
    singleClickToZoom: boolean;
};

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
 * @param {boolean} singleClickToZoom Overrides the default behavior of double clicking causing an image zoom to a single click
 */
const ImageStage = ({
    currentIndex,
    images,
    onClose,
    onNext,
    onPrev,
    renderImageOverlay,
    renderNextButton,
    renderPrevButton,
    singleClickToZoom,
}: IImageStageProps) => {
    // Extra sanity check that the next/prev image exists before moving to it
    const canPrev = currentIndex > 0;
    const canNext = currentIndex + 1 < images.length;

    return (
        <ImageStageContainer className="lightbox-image-stage">
            {renderPrevButton({ canPrev })}
            <ImagePager
                currentIndex={currentIndex}
                images={images}
                onClose={onClose}
                onNext={onNext}
                onPrev={onPrev}
                renderImageOverlay={renderImageOverlay}
                singleClickToZoom={singleClickToZoom}
            />
            {renderNextButton({ canNext })}
        </ImageStageContainer>
    );
};

export default ImageStage;

const ImageStageContainer = styled.div`
    flex-grow: 1;
    position: relative;
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
`;
