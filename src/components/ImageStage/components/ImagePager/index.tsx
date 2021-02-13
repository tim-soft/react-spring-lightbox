/* eslint-disable react/no-array-index-key */
import React, { useRef, useEffect, useState } from 'react';
import { useSprings, animated } from '@react-spring/web';
import { useGesture } from 'react-use-gesture';
import styled from 'styled-components';
import { useWindowSize } from '../../utils';
import Image from '../Image';

type IImagePager = {
    /** Index of image in images array that is currently shown */
    currentIndex: number;
    /** Array of image objects to be shown in Lightbox */
    images: {
        alt: string;
        src: string;
    }[];
    /** Function that closes the Lightbox */
    onClose: () => void;
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
    onClose,
    onNext,
    onPrev,
    renderImageOverlay,
    singleClickToZoom,
}: IImagePager) => {
    const firstRender = useRef(true);
    const imageStageRef = useRef(
        [...Array(images.length)].map(() => React.createRef<HTMLElement>()) ||
            []
    );
    const { height: windowHeight, width: pageWidth } = useWindowSize();
    const [disableDrag, setDisableDrag] = useState<boolean>(false);
    const [pagerHeight, setPagerHeight] = useState<'100%' | number>('100%');
    const [isDragging, setIsDragging] = useState<boolean>(false);

    // Generate page positions based on current index
    const getPagePositions = (i: number, down = false, xDelta = 0) => {
        const x = (i - currentIndex) * pageWidth + (down ? xDelta : 0);
        if (i < currentIndex - 1 || i > currentIndex + 1)
            return { display: 'none', x };
        return { display: 'flex', x };
    };

    /**
     * Animates translateX of all images at the same time
     *
     * @see https://www.react-spring.io/docs/hooks/use-springs
     */
    const [pagerSprings, set] = useSprings(images.length, getPagePositions);

    // Determine the absolute height of the image pager
    useEffect(() => {
        const currImageRef = imageStageRef?.current[currentIndex];
        let currPagerHeight = 0;

        if (currImageRef && currImageRef?.current) {
            currPagerHeight = currImageRef.current.clientHeight - 50;
        }

        if (pagerHeight !== currPagerHeight) {
            setPagerHeight(currPagerHeight);
        }
    }, [currentIndex, pagerHeight, windowHeight]);

    // Animate page change if currentIndex changes
    useEffect(() => {
        // No need to set page position for initial render
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }

        // Update page positions after prev/next page state change
        set((i) => getPagePositions(i));
    });

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
                memo = { currentMovementX: 0 },
            }) => {
                // Disable drag if Image has been zoomed in to allow for panning
                if (disableDrag || xMovement === 0)
                    return { currentMovementX: 0 };
                if (!isDragging) setIsDragging(true);

                const isHorizontalDrag = Math.abs(xDir) > 0.7;
                const draggedFarEnough =
                    down && isHorizontalDrag && distance > pageWidth / 3.5;
                const draggedFastEnough =
                    down && isHorizontalDrag && velocity > 2;

                // Handle next/prev image from valid drag
                if ((draggedFarEnough || draggedFastEnough) && active) {
                    console.log({ active, down });
                    const goToIndex = xDir > 0 ? -1 : 1;

                    // Cancel gesture animation
                    cancel();

                    if (goToIndex > 0) onNext();
                    else if (goToIndex < 0) onPrev();

                    // reset current xposition
                    memo.currentMovementX = 0;
                    return memo;
                }

                // Don't move pager during two+ finger touch events, i.e. pinch-zoom
                if (touches > 1) {
                    cancel();

                    // reset current xposition
                    memo.currentMovement = 0;
                    return memo;
                }

                // Update page x-coordinates for single finger/mouse gestures
                set((i) => getPagePositions(i, down, xMovement));

                // set next xposition to the current xMovement
                memo.currentMovementX = xMovement;
                return memo;
            },
            onDragEnd: () => {
                if (isDragging) {
                    // Add small timeout buffer to prevent event handlers from firing in child Images
                    setTimeout(() => setIsDragging(false), 100);
                }
            },
            onWheel: ({
                distance,
                velocity,
                direction: [xDir, yDir],
                ctrlKey,
            }) => {
                // Disable drag if Image has been zoomed in to allow for panning
                if (ctrlKey || disableDrag || velocity === 0) return;

                if (!isDragging) {
                    setIsDragging(true);
                }

                const draggedFarEnough = distance > pageWidth / 3;
                const draggedFastEnough =
                    velocity > 1.5 && distance <= pageWidth / 3;

                // Handle next/prev image from valid drag
                if (draggedFarEnough || draggedFastEnough) {
                    const goToIndex = xDir + yDir > 0 ? -1 : 1;

                    if (goToIndex > 0) onNext();
                    else if (goToIndex < 0) onPrev();
                }
            },
            onWheelEnd: () => {
                set((i) => getPagePositions(i, false, 0));
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
        <>
            {pagerSprings.map(({ display, x }, i) => (
                // @ts-ignore
                <AnimatedImagePager
                    {...bind()}
                    className="lightbox-image-pager"
                    // @ts-ignore
                    key={i}
                    // @ts-ignore
                    onClick={() =>
                        Math.abs(x.getValue()) < 1 && !disableDrag && onClose()
                    }
                    ref={imageStageRef.current[i]}
                    role="presentation"
                    // @ts-ignore
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
                                    alt={images[i].alt}
                                    isCurrentImage={i === currentIndex}
                                    pagerHeight={pagerHeight}
                                    pagerIsDragging={isDragging}
                                    setDisableDrag={setDisableDrag}
                                    singleClickToZoom={singleClickToZoom}
                                    src={images[i].src}
                                />
                                {renderImageOverlay()}
                            </ImageContainer>
                        </PagerInnerContentWrapper>
                    </PagerContentWrapper>
                </AnimatedImagePager>
            ))}
        </>
    );
};

ImagePager.displayName = 'ImagePager';

export default ImagePager;

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
`;
