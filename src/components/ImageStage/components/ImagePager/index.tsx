import { animated, useSprings } from '@react-spring/web';
import { useGesture } from 'react-use-gesture';
import Image from '../Image';
import React, { useEffect, useRef, useState } from 'react';
import type { ImagesList } from '../../../../types/ImagesList';

type IImagePager = {
    /** Index of image in images array that is currently shown */
    currentIndex: number;
    /** image stage height */
    imageStageHeight: number;
    /** image stage width */
    imageStageWidth: number;
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
    /** Overrides the default behavior of double clicking causing an image zoom to a single click */
    singleClickToZoom: boolean;
};

/**
 * Gesture controlled surface that animates prev/next page changes via spring physics.
 */
const ImagePager = ({
    currentIndex,
    images,
    imageStageHeight,
    imageStageWidth,
    inline,
    onClose,
    onNext,
    onPrev,
    renderImageOverlay,
    singleClickToZoom,
}: IImagePager) => {
    const firstRender = useRef(true);

    const [disableDrag, setDisableDrag] = useState<boolean>(false);
    const [pagerHeight, setPagerHeight] = useState<'100%' | number>('100%');
    const [isDragging, setIsDragging] = useState<boolean>(false);

    //Determine the absolute height of the image pager
    useEffect(() => {
        const currPagerHeight = inline
            ? imageStageHeight
            : imageStageHeight - 50;

        if (currPagerHeight !== pagerHeight) {
            setPagerHeight(currPagerHeight);
        }
    }, [inline, pagerHeight, imageStageHeight]);

    // Generate page positions based on current index
    const getPagePositions = React.useCallback(
        (i: number, down = false, xDelta = 0) => {
            const x =
                (i - currentIndex) * imageStageWidth + (down ? xDelta : 0);

            if (i < currentIndex - 1 || i > currentIndex + 1) {
                return { display: 'none', x };
            }
            return { display: 'flex', x };
        },
        [currentIndex, imageStageWidth],
    );

    /**
     * Animates translateX of all images at the same time
     *
     * @see https://www.react-spring.io/docs/hooks/use-springs
     */
    const [pagerSprings, springsApi] = useSprings(images.length, (i) =>
        getPagePositions(i),
    );

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
                active,
                cancel,
                direction: [xDir],
                distance,
                down,
                movement: [xMovement],
                tap,
                touches,
                velocity,
            }) => {
                // Disable drag if Image has been zoomed in to allow for panning
                if (disableDrag || xMovement === 0 || tap) {
                    return;
                }
                if (!isDragging) {
                    setIsDragging(true);
                }

                const isHorizontalDrag = Math.abs(xDir) > 0.7;
                const draggedFarEnough =
                    down &&
                    isHorizontalDrag &&
                    distance > imageStageWidth / 3.5;
                const draggedFastEnough =
                    down && isHorizontalDrag && velocity > 2;

                // Handle next/prev image from valid drag
                if ((draggedFarEnough || draggedFastEnough) && active) {
                    const goToIndex = xDir > 0 ? -1 : 1;

                    // Cancel gesture event
                    cancel();

                    if (goToIndex > 0) {
                        onNext();
                    } else if (goToIndex < 0) {
                        onPrev();
                    }

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
            onWheel: ({ ctrlKey, direction: [xDir, yDir], velocity }) => {
                // Disable drag if Image has been zoomed in to allow for panning
                if (ctrlKey || disableDrag || velocity === 0) {
                    return;
                }

                if (!isDragging) {
                    setIsDragging(true);
                }

                const draggedFastEnough = velocity > 1.1;

                // Handle next/prev image from valid drag
                if (draggedFastEnough) {
                    const goToIndex = xDir + yDir > 0 ? -1 : 1;

                    if (goToIndex > 0) {
                        onNext();
                    } else if (goToIndex < 0) {
                        onPrev();
                    }
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
            wheel: {
                enabled: !inline,
            },
        },
    );

    return (
        <div style={{ height: '100%', width: '100%' }}>
            {pagerSprings.map(({ display, x }, i) => (
                <animated.span
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
                    role="presentation"
                    style={{
                        alignItems: 'center',
                        bottom: 0,
                        display,
                        flexDirection: 'column',
                        height: '100%',
                        justifyContent: 'center',
                        left: 0,
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        touchAction: !inline ? 'none' : 'pan-y',
                        transform: x.to(
                            (xInterp: number) => `translateX(${xInterp}px)`,
                        ),
                        width: '100%',
                        willChange: 'transform',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            width: '100%',
                        }}
                    >
                        <div
                            style={{
                                alignItems: 'center',
                                display: 'flex',
                                justifyContent: 'center',
                            }}
                        >
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.nativeEvent.stopImmediatePropagation();
                                }}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    touchAction: !inline ? 'none' : 'pan-y',
                                    userSelect: 'none',
                                    width: '100%',
                                }}
                            >
                                <Image
                                    imgProps={images[i]}
                                    inline={inline}
                                    isCurrentImage={i === currentIndex}
                                    pagerHeight={pagerHeight}
                                    pagerIsDragging={isDragging}
                                    setDisableDrag={setDisableDrag}
                                    singleClickToZoom={singleClickToZoom}
                                />
                                {renderImageOverlay()}
                            </div>
                        </div>
                    </div>
                </animated.span>
            ))}
        </div>
    );
};

ImagePager.displayName = 'ImagePager';

export default ImagePager;
