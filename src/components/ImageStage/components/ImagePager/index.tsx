import { animated, useSprings } from '@react-spring/web';
import { useGesture } from '@use-gesture/react';
import React, { useEffect, useRef, useState } from 'react';

import type { ImagesList } from '../../../../types/ImagesList';

import Image from '../Image';

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
    const [isDragging, setIsDragging] = useState<boolean>(false);

    // The absolute height of the image pager, with 50px of room for controls unless inline
    const pagerHeight = inline ? imageStageHeight : imageStageHeight - 50;

    // Generate page positions based on current index
    const getPagePositions = React.useCallback(
        (i: number, down = false, xDelta = 0) => {
            const x = (i - currentIndex) * imageStageWidth;

            // Pages past the neighbors are hidden, so drags skip them and a page change sets them in place
            if (i < currentIndex - 1 || i > currentIndex + 1) {
                return { display: 'none', x };
            }
            return { display: 'flex', x: x + (down ? xDelta : 0) };
        },
        [currentIndex, imageStageWidth]
    );

    // A drag moves only the pages it can show. Hidden pages already rest in place.
    const getShownPagePositions = (i: number, down = false, xDelta = 0) =>
        Math.abs(i - currentIndex) <= 1 ? getPagePositions(i, down, xDelta) : null;

    /**
     * Animates translateX of all images at the same time
     *
     * @see https://www.react-spring.io/docs/hooks/use-springs
     */
    const [pagerSprings, springsApi] = useSprings(images.length, (i) => getPagePositions(i));

    // Animate page change if currentIndex changes
    useEffect(() => {
        // No need to set page position for initial render
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        // Update page positions after prev/next page state change. Hidden pages move with set(), because
        // react-spring searches its whole frame queue for each spring that start() adds to it.
        springsApi.start((i, ctrl) => {
            const position = getPagePositions(i);
            if (position.display === 'none') {
                ctrl.set(position);
                return null;
            }
            return position;
        });
    }, [currentIndex, getPagePositions, springsApi]);

    /**
     * Update each Image's visibility and translateX offset during dragging
     *
     * @see https://use-gesture.netlify.app/docs/hooks/#usegesture
     */
    const bind = useGesture(
        {
            onDrag: ({
                active,
                cancel,
                delta: [xDelta, yDelta],
                down,
                elapsedTime,
                first,
                movement: [xMovement, yMovement],
                tap,
                timeDelta,
                touches,
            }) => {
                // Disable drag if Image has been zoomed in to allow for panning
                if (disableDrag || xMovement === 0 || tap) {
                    return;
                }
                if (!isDragging) {
                    setIsDragging(true);
                }

                // The thresholds below were tuned with react-use-gesture 9, which measured the drag
                // in a straight line, and the last move's direction as a unit vector and its speed
                // in px/ms. @use-gesture gives no speed for the first move, so it's timed from the press.
                const moveLength = Math.hypot(xDelta, yDelta);
                const xDir = moveLength === 0 ? 0 : xDelta / moveLength;
                const distance = Math.hypot(xMovement, yMovement);
                const moveDuration = first ? elapsedTime : timeDelta;
                const velocity = moveDuration > 0 ? moveLength / moveDuration : 0;

                const isHorizontalDrag = Math.abs(xDir) > 0.7;
                const draggedFarEnough = down && isHorizontalDrag && distance > imageStageWidth / 3.5;
                const draggedFastEnough = down && isHorizontalDrag && velocity > 2;

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
                springsApi.start((i) => getShownPagePositions(i, down, xMovement));
                return;
            },
            onDragEnd: () => {
                springsApi.start((i) => getShownPagePositions(i));
                // Add small timeout buffer to prevent event handlers from firing in child Images
                setTimeout(() => setIsDragging(false), 100);
            },
            onWheel: ({
                ctrlKey,
                delta: [xDelta, yDelta],
                last,
                memo: canPage = true,
                velocity: [xVelocity, yVelocity],
            }) => {
                // react-use-gesture 9 reported one speed for both axes, and 0 for the
                // last wheel event, where @use-gesture repeats the one before it
                const velocity = last ? 0 : Math.hypot(xVelocity, yVelocity);

                // Disable drag if Image has been zoomed in to allow for panning
                if (ctrlKey || disableDrag || velocity === 0) {
                    return;
                }

                if (!isDragging) {
                    setIsDragging(true);
                }

                // A trackpad sends wheel events for about a second after the fingers lift,
                // as its scroll slows down, so a swipe pages once. Fingers landing for another
                // swipe stop the scroll, so the next swipe can page once the scroll nearly stops.
                if (!canPage) {
                    return velocity < 0.2;
                }

                const draggedFastEnough = velocity > 1.1;

                // Handle next/prev image from valid drag
                if (draggedFastEnough) {
                    const goToIndex = xDelta + yDelta > 0 ? -1 : 1;

                    if (goToIndex > 0) {
                        onNext();
                    } else if (goToIndex < 0) {
                        onPrev();
                    }
                }

                return !draggedFastEnough;
            },
            onWheelEnd: () => {
                springsApi.start((i) => getShownPagePositions(i));
                // Add small timeout buffer to prevent event handlers from firing in child Images
                setTimeout(() => setIsDragging(false), 100);
            },
        },
        {
            drag: {
                filterTaps: true,
                pointer: { keys: false },
            },
            wheel: {
                enabled: !inline,
            },
        }
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
                            return Math.abs(x.get()) < 1 && !disableDrag && onClose();
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
                        transform: x.to((xInterp: number) => `translateX(${xInterp}px)`),
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
                            {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- keeps clicks on the image from reaching the page's close handler */}
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
                                    isShown={Math.abs(i - currentIndex) <= 1}
                                    pagerHeight={pagerHeight}
                                    // Hidden pages get no input, so they skip the render when a drag starts or ends
                                    pagerIsDragging={isDragging && Math.abs(i - currentIndex) <= 1}
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
