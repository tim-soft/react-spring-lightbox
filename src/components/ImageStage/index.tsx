import ImagePager from './components/ImagePager';
import React from 'react';
import styled from 'styled-components';
import useRefSize from './utils/useRefSize';
import type { ImagesList } from '../../types/ImagesList';
import SSRImagePager from './components/SSRImagePager/SSRImagePager';

type IImageStageProps = {
    /** classnames are applied to the root ImageStage component */
    className?: string;
    /** Index of image in images array that is currently shown */
    currentIndex: number;
    /** Array of image objects to be shown in Lightbox */
    images: ImagesList;
    /** Affects Width calculation method, depending on whether the Lightbox is Inline or not */
    inline: boolean;
    /** Function that closes the Lightbox */
    onClose?: () => void;
    /** Function that can be called to disable dragging in the pager */
    onNext: () => void;
    /** True if this image is currently shown in pager, otherwise false */
    onPrev: () => void;
    /** A React component that renders inside the image stage, useful for making overlays over the image */
    renderImageOverlay: () => React.ReactNode;
    /** A React component that is used for next button in image pager */
    renderNextButton: ({ canNext }: { canNext: boolean }) => React.ReactNode;
    /** A React component that is used for previous button in image pager */
    renderPrevButton: ({ canPrev }: { canPrev: boolean }) => React.ReactNode;
    /** Overrides the default behavior of double clicking causing an image zoom to a single click */
    singleClickToZoom: boolean;
};

/**
 * Containing element for ImagePager and prev/next button controls
 */
const ImageStage = ({
    className = '',
    currentIndex,
    images,
    inline,
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

    const onNextImage = canNext ? onNext : () => null;
    const onPrevImage = canPrev ? onPrev : () => null;

    const [{ height: containerHeight, width: containerWidth }, containerRef] =
        useRefSize();

    return (
        <ImageStageContainer
            className={className}
            data-testid="lightbox-image-stage"
            ref={containerRef}
        >
            {renderPrevButton({ canPrev })}
            {containerWidth ? (
                <ImagePager
                    currentIndex={currentIndex}
                    images={images}
                    imageStageHeight={containerHeight}
                    imageStageWidth={containerWidth}
                    inline={inline}
                    onClose={onClose}
                    onNext={onNextImage}
                    onPrev={onPrevImage}
                    renderImageOverlay={renderImageOverlay}
                    singleClickToZoom={singleClickToZoom}
                />
            ) : (
                <>
                    {inline ? (
                        <SSRImagePager
                            currentIndex={currentIndex}
                            images={images}
                        />
                    ) : null}
                </>
            )}
            {renderNextButton({ canNext })}
        </ImageStageContainer>
    );
};

export default ImageStage;

const ImageStageContainer = styled.div`
    position: relative;
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
`;
