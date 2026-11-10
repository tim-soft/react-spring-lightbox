import { animated, useSpringValue, useSprings } from '@react-spring/web';
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

// Where page i rests while page `index` is shown: in a row, with pages past the neighbors hidden
const getRestingPosition = (i: number, index: number, width: number) => {
    const x = (i - index) * width;
    return { display: Math.abs(i - index) > 1 ? ('none' as const) : ('flex' as const), x };
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
    const shownSrc = images[currentIndex]?.src;
    // Where the last page change put the pages
    const placement = useRef({ index: currentIndex, src: shownSrc, width: imageStageWidth });

    const [disableDrag, setDisableDrag] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    // The absolute height of the image pager, with 50px of room for controls unless inline
    const pagerHeight = inline ? imageStageHeight : imageStageHeight - 50;

    // Generate page positions based on current index
    const getPagePositions = React.useCallback(
        (i: number, down = false, xDelta = 0) => {
            const { display, x } = getRestingPosition(i, currentIndex, imageStageWidth);
            return { display, x: display === 'flex' && down ? x + xDelta : x };
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
    // The stage width the pages' x was laid out for. Each page's transform is x as a percentage of it, so a wider
    // window moves the pages in the same layout that widens them, before the pager learns the new width.
    const layoutWidth = useSpringValue(imageStageWidth);

    // Animate page change if currentIndex changes
    useEffect(() => {
        // No need to set page position for initial render
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        const previous = placement.current;
        placement.current = { index: currentIndex, src: shownSrc, width: imageStageWidth };
        // A new file for the same page, as progressive loading swaps in, moves nothing, even mid-drag
        if (currentIndex === previous.index && imageStageWidth === previous.width) {
            return;
        }
        if (imageStageWidth !== previous.width) {
            // Rescale x with the width, so no page moves on screen. Pages at rest are then in their new places. The
            // width changes first, because a page's transform reads it when its x changes.
            layoutWidth.set(imageStageWidth);
            springsApi.set((_, ctrl) => ({ x: (ctrl.springs.x.get() * imageStageWidth) / previous.width }));
        }
        const step = currentIndex - previous.index;
        // The old image's page holds another image now, as after images are added or swapped
        const replaced = images[previous.index]?.src !== previous.src;
        // Keeping the same image in view while images are added before it is no page change
        const moved = step !== 0 && shownSrc === previous.src && replaced;
        // A change of more than one page slides like a page turn
        const direction = Math.abs(step) > 1 && !moved ? Math.sign(step) : 0;
        // Update page positions after prev/next page state change. Hidden pages move with set(), because
        // react-spring searches its whole frame queue for each spring that start() adds to it.
        springsApi.start((i, ctrl) => {
            const target = getPagePositions(i);
            if (moved) {
                ctrl.set(target);
                return null;
            }
            const x = ctrl.springs.x.get();
            const onStage = ctrl.springs.display.get() !== 'none' && Math.abs(x) < imageStageWidth;
            if (target.display === 'none') {
                // A leaving page moves its goal a stage width, as the page that follows it does, so the two stay a
                // stage width apart. A resize changes no page and leaves the goal in the old width, so the page
                // slides off the side it is on. A page that now holds another image hides at once, and so does a
                // page whose goal would land on the center, as the old image past the new one in a jump does.
                const leaves = onStage && !(replaced && i === previous.index);
                const edge = leaves ? -direction || Math.sign(x) : 0;
                const exit =
                    step === 0 ? edge * imageStageWidth : ctrl.springs.x.goal - (direction || step) * imageStageWidth;
                if (edge === 0 || exit === 0) {
                    ctrl.set(target);
                    return null;
                }
                void ctrl.start({ display: 'flex', x: exit }).then(({ finished }) => {
                    // An interrupted page does not finish, and the update that interrupted it decides where it goes
                    const { index, width } = placement.current;
                    if (finished && Math.abs(i - index) > 1) {
                        ctrl.set(getRestingPosition(i, index, width));
                    }
                });
                return null;
            }
            if (direction !== 0 && !onStage) {
                // Only the new image slides on, from the side the jump came from
                if (i !== currentIndex) {
                    ctrl.set(target);
                    return null;
                }
                ctrl.set({ ...target, x: direction * imageStageWidth });
            }
            return target;
        });
    }, [currentIndex, getPagePositions, imageStageWidth, images, layoutWidth, shownSrc, springsApi]);

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
                        // Observing only x keeps one observer per page. A resize changes x along with the width.
                        transform: x.to((xValue: number) => `translateX(${(xValue / layoutWidth.get()) * 100}%)`),
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
