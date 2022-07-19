import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { useSprings, animated } from '@react-spring/web';
import { useGesture } from 'react-use-gesture';
import styled from 'styled-components';
import Image from '../Image';
import type { ImagesList } from '../../../../types/ImagesList';
import useRefSize from '../../utils/useRefSize';

type IImagePager = {
    /** Index of image in images array that is currently shown */
    currentIndex: number;
    /** Array of image objects to be shown in Lightbox */
    images: ImagesList;
    /** Affects Width calculation method, depending on whether the Lightbox is Inline or not */
    inline?: boolean;
    /** Function that closes the Lightbox */
    onClose?: () => void;
    /** Function that can be called to disable dragging in the pager */
    onNext: () => void;
    /** True if this image is currently shown in pager, otherwise false */
    onPrev: () => void;
    /** A React component that renders inside the image stage, useful for making overlays over the image */
    renderImageOverlay: () => React.ReactNode;
    /** Overrides the default behavior of double clicking causing an image zoom to a single click */
    singleClickToZoom: boolean;
};

/**
 * Gesture controlled surface that animates prev/next page changes via spring physics.
 */
const ImagePager = ({
    currentIndex,
    images,
    inline,
    onClose,
    onNext,
    onPrev,
    renderImageOverlay,
    singleClickToZoom,
}: IImagePager) => {
    const firstRender = useRef(true);
    const imageStageRef = useRef(
        [...Array(images.length)].map(() =>
            React.createRef<HTMLDivElement>()
        ) || []
    );
    const containerRef = useRef(null);
    const { height: containerHeight, width: containerWidth } =
        useRefSize(containerRef);

    const [disableDrag, setDisableDrag] = useState<boolean>(false);
    const [pagerHeight, setPagerHeight] = useState<'100%' | number>('100%');
    const [isDragging, setIsDragging] = useState<boolean>(false);

    // Generate page positions based on current index
    const getPagePositions = React.useCallback(
        (i: number, down = false, xDelta = 0) => {
            const x = (i - currentIndex) * containerWidth + (down ? xDelta : 0);
            if (i < currentIndex - 1 || i > currentIndex + 1)
                return { display: 'none', x };
            return { display: 'flex', x };
        },
        [currentIndex, containerWidth]
    );

    /**
     * Animates translateX of all images at the same time
     *
     * @see https://www.react-spring.io/docs/hooks/use-springs
     */
    const [pagerSprings, springsApi] = useSprings(images.length, (i) =>
        getPagePositions(i)
    );

    // Determine the absolute height of the image pager
    useEffect(() => {
        const currImageRef = imageStageRef?.current[currentIndex];
        let currPagerHeight = containerHeight;
        if (currImageRef && currImageRef?.current) {
            console.log({ containerHeight });
            console.log({
                currentImageStageHeight: currImageRef.current.clientHeight,
            });
            currPagerHeight = inline
                ? currImageRef.current.clientHeight
                : currImageRef.current.clientHeight - 50;
        }
        console.log({ currPagerHeight, pagerHeight });
        if (pagerHeight !== currPagerHeight) {
            console.log({ currPagerHeight, pagerHeight });
            setPagerHeight(currPagerHeight);
        }
    }, [currentIndex, inline, pagerHeight, containerHeight]);

    // Animate page change if currentIndex changes
    useEffect(() => {
        // No need to set page position for initial render
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }

        // Update page positions after prev/next page state change
        springsApi.start((i) => getPagePositions(i));
    }, [currentIndex, getPagePositions, springsApi]);

    /**
     * Update each Image's visibility and translateX offset during dragging
     *
     * @see https://github.com/react-spring/react-use-gesture
     */
    const bind = useGesture(
        {
            onDrag: ({
                down,
                movement: [xMovement],
                direction: [xDir],
                velocity,
                distance,
                cancel,
                active,
                touches,
                tap,
            }) => {
                // Disable drag if Image has been zoomed in to allow for panning
                if (disableDrag || xMovement === 0 || tap) return;
                if (!isDragging) setIsDragging(true);

                const isHorizontalDrag = Math.abs(xDir) > 0.7;
                const draggedFarEnough =
                    down && isHorizontalDrag && distance > containerWidth / 3.5;
                const draggedFastEnough =
                    down && isHorizontalDrag && velocity > 2;

                // Handle next/prev image from valid drag
                if ((draggedFarEnough || draggedFastEnough) && active) {
                    const goToIndex = xDir > 0 ? -1 : 1;

                    // Cancel gesture event
                    cancel();

                    if (goToIndex > 0) onNext();
                    else if (goToIndex < 0) onPrev();

                    return;
                }

                // Don't move pager during two+ finger touch events, i.e. pinch-zoom
                if (touches > 1) {
                    cancel();
                    return;
                }

                // Update page x-coordinates for single finger/mouse gestures
                springsApi.start((i) => getPagePositions(i, down, xMovement));
                return;
            },
            onDragEnd: () => {
                if (isDragging) {
                    springsApi.start((i) => getPagePositions(i));
                    // Add small timeout buffer to prevent event handlers from firing in child Images
                    setTimeout(() => setIsDragging(false), 100);
                }
            },
            onWheel: ({ velocity, direction: [xDir, yDir], ctrlKey }) => {
                // Disable drag if Image has been zoomed in to allow for panning
                if (ctrlKey || disableDrag || velocity === 0) return;

                if (!isDragging) {
                    setIsDragging(true);
                }

                const draggedFastEnough = velocity > 1.1;

                // Handle next/prev image from valid drag
                if (draggedFastEnough) {
                    const goToIndex = xDir + yDir > 0 ? -1 : 1;

                    if (goToIndex > 0) onNext();
                    else if (goToIndex < 0) onPrev();
                }
            },
            onWheelEnd: () => {
                springsApi.start((i) => getPagePositions(i));
                // Add small timeout buffer to prevent event handlers from firing in child Images
                setTimeout(() => setIsDragging(false), 100);
            },
        },
        {
            drag: {
                filterTaps: true,
            },
        }
    );

    return (
        <ImagePagerContainer ref={containerRef}>
            {pagerSprings.map(({ display, x }, i) => (
                <AnimatedImagePager
                    {...bind()}
                    className="lightbox-image-pager"
                    key={i}
                    onClick={() => {
                        if (onClose) {
                            return (
                                Math.abs(x.get()) < 1 &&
                                !disableDrag &&
                                onClose()
                            );
                        }
                    }}
                    ref={imageStageRef.current[i]}
                    role="presentation"
                    style={{
                        display,
                        transform: x.to(
                            (xInterp: number) => `translateX(${xInterp}px)`
                        ),
                    }}
                >
                    <PagerContentWrapper>
                        <PagerInnerContentWrapper>
                            <ImageContainer
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.nativeEvent.stopImmediatePropagation();
                                }}
                            >
                                <Image
                                    imgProps={images[i]}
                                    isCurrentImage={i === currentIndex}
                                    pagerHeight={pagerHeight}
                                    pagerIsDragging={isDragging}
                                    setDisableDrag={setDisableDrag}
                                    singleClickToZoom={singleClickToZoom}
                                />
                                {renderImageOverlay()}
                            </ImageContainer>
                        </PagerInnerContentWrapper>
                    </PagerContentWrapper>
                </AnimatedImagePager>
            ))}
        </ImagePagerContainer>
    );
};

ImagePager.displayName = 'ImagePager';

export default ImagePager;

const ImagePagerContainer = styled.div`
    height: 100%;
    width: 100%;
`;

const PagerInnerContentWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
`;

const PagerContentWrapper = styled.div`
    width: 100%;
    display: flex;
    justify-content: center;
`;

const AnimatedImagePager = styled(animated.div)`
    position: absolute;
    top: 0px;
    left: 0px;
    right: 0px;
    bottom: 0px;
    height: 100%;
    width: 100%;
    will-change: transform;
    touch-action: none;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;

const ImageContainer = styled.div`
    position: relative;
    touch-action: none;
    user-select: none;
    display: flex;
    justify-content: center;
    width: 100%;
`;
