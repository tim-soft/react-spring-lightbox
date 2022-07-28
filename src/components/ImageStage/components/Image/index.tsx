import { animated, to, useSpring } from '@react-spring/web';
import {
    getTranslateOffsetsFromScale,
    imageIsOutOfBounds,
    useDoubleClick,
} from '../../utils';
import { useGesture } from 'react-use-gesture';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import type { ImagesListItem } from '../../../../types/ImagesList';

const defaultImageTransform = {
    pinching: false,
    scale: 1,
    translateX: 0,
    translateY: 0,
};

type IImageProps = {
    /** Any valid <img /> props to pass to the lightbox img element ie src, alt, caption etc*/
    imgProps: ImagesListItem;
    /** Affects Width calculation method, depending on whether the Lightbox is Inline or not */
    inline: boolean;
    /** True if this image is currently shown in pager, otherwise false */
    isCurrentImage: boolean;
    /** Fixed height of the image stage, used to restrict maximum height of images */
    pagerHeight: '100%' | number;
    /** Indicates parent ImagePager is in a state of dragging, if true click to zoom is disabled */
    pagerIsDragging: boolean;
    /** Function that can be called to disable dragging in the pager */
    setDisableDrag: (disable: boolean) => void;
    /** Overrides the default behavior of double clicking causing an image zoom to a single click */
    singleClickToZoom: boolean;
};

/**
 * Animates pinch-zoom + panning on image using spring physics
 */
const Image = ({
    imgProps: { style: imgStyleProp, ...restImgProps },
    inline,
    isCurrentImage,
    pagerHeight,
    pagerIsDragging,
    setDisableDrag,
    singleClickToZoom,
}: IImageProps) => {
    const [isPanningImage, setIsPanningImage] = useState<boolean>(false);
    const imageRef = useRef<HTMLImageElement>(null);

    /**
     * Animates scale and translate offsets of Image as they change in gestures
     *
     * @see https://www.react-spring.io/docs/hooks/use-spring
     */
    const [{ scale, translateX, translateY }, springApi] = useSpring(() => ({
        ...defaultImageTransform,
        onChange: (result, instance) => {
            if (result.value.scale < 1 || !result.value.pinching) {
                instance.start(defaultImageTransform);
            }

            if (result.value.scale > 1 && imageIsOutOfBounds(imageRef)) {
                instance.start(defaultImageTransform);
            }
        },
        // Enable dragging in ImagePager if image is at the default size
        onRest: (result, instance) => {
            if (result.value.scale === 1) {
                instance.start(defaultImageTransform);
                setDisableDrag(false);
            }
        },
    }));

    // Reset scale of this image when dragging to new image in ImagePager
    useEffect(() => {
        if (!isCurrentImage && scale.get() !== 1) {
            springApi.start(defaultImageTransform);
        }
    }, [isCurrentImage, scale, springApi]);

    /**
     * Update Image scale and translate offsets during pinch/pan gestures
     *
     * @see https://github.com/react-spring/react-use-gesture#usegesture-hook-supporting-multiple-gestures-at-once
     */
    useGesture(
        {
            onDrag: ({
                movement: [xMovement, yMovement],
                pinching,
                cancel,
                first,
                memo = { initialTranslateX: 0, initialTranslateY: 0 },
                touches,
                tap,
            }) => {
                if (pagerIsDragging || scale.get() === 1 || tap) {
                    return;
                }

                // Disable click to zoom during drag
                if (xMovement && yMovement && !isPanningImage) {
                    setIsPanningImage(true);
                }

                if (touches > 1) {
                    return;
                }
                if (pinching || scale.get() <= 1) {
                    return;
                }

                // Prevent dragging image out of viewport
                if (scale.get() > 1 && imageIsOutOfBounds(imageRef)) {
                    cancel();
                    return;
                } else {
                    if (first) {
                        return {
                            initialTranslateX: translateX.get(),
                            initialTranslateY: translateY.get(),
                        };
                    }

                    // Translate image from dragging
                    springApi.start({
                        translateX: memo.initialTranslateX + xMovement,
                        translateY: memo.initialTranslateY + yMovement,
                    });

                    return memo;
                }
            },
            onDragEnd: ({ memo }) => {
                if (memo !== undefined) {
                    // Add small timeout to prevent onClick handler from firing after drag
                    setTimeout(() => setIsPanningImage(false), 100);
                }
            },
            onPinch: ({
                movement: [xMovement],
                origin: [touchOriginX, touchOriginY],
                event,
                ctrlKey,
                last,
                cancel,
            }) => {
                if (pagerIsDragging) {
                    return;
                }

                // Prevent ImagePager from registering isDragging
                setDisableDrag(true);

                // Disable click to zoom during pinch
                if (xMovement && !isPanningImage) {
                    setIsPanningImage(true);
                }

                // Don't calculate new translate offsets on final frame
                if (last) {
                    cancel();
                    return;
                }

                // Speed up pinch zoom when using mouse versus touch
                const SCALE_FACTOR = ctrlKey ? 1000 : 250;
                const pinchScale = scale.get() + xMovement / SCALE_FACTOR;
                const pinchDelta = pinchScale - scale.get();

                /**
                 * Calculate touch origin for pinch/zoom
                 *
                 * if event is a touch event (React.TouchEvent<Element>, TouchEvent or WebKitGestureEvent) use touchOriginX/Y
                 * if event is a wheel event (React.WheelEvent<Element> or WheelEvent) use the mouse cursor's clientX/Y
                 */
                let touchOrigin: [touchOriginX: number, touchOriginY: number] =
                    [touchOriginX, touchOriginY];
                if ('clientX' in event && 'clientY' in event && ctrlKey) {
                    touchOrigin = [event.clientX, event.clientY];
                }

                // Calculate the amount of x, y translate offset needed to
                // zoom-in to point as image scale grows
                const [newTranslateX, newTranslateY] =
                    getTranslateOffsetsFromScale({
                        currentTranslate: [translateX.get(), translateY.get()],
                        imageRef,
                        pinchDelta,
                        scale: scale.get(),
                        // Use the [x, y] coords of mouse if a trackpad or ctrl + wheel event
                        // Otherwise use touch origin
                        touchOrigin,
                    });

                // Restrict the amount of zoom between half and 3x image size
                if (pinchScale < 0.5) {
                    springApi.start({ pinching: true, scale: 0.5 });
                } else if (pinchScale > 3.0) {
                    springApi.start({ pinching: true, scale: 3.0 });
                } else {
                    springApi.start({
                        pinching: true,
                        scale: pinchScale,
                        translateX: newTranslateX,
                        translateY: newTranslateY,
                    });
                }
            },
            onPinchEnd: () => {
                if (!pagerIsDragging) {
                    if (scale.get() > 1) {
                        setDisableDrag(true);
                    } else {
                        springApi.start(defaultImageTransform);
                    }
                    // Add small timeout to prevent onClick handler from firing after panning
                    setTimeout(() => setIsPanningImage(false), 100);
                }
            },
        },
        /**
         * useGesture config
         * @see https://github.com/react-spring/react-use-gesture#usegesture-config
         */
        {
            domTarget: imageRef as React.RefObject<EventTarget>,
            drag: {
                filterTaps: true,
            },
            enabled: !inline,
            eventOptions: {
                passive: false,
            },
        }
    );

    // Handle click/tap on image
    useDoubleClick({
        [singleClickToZoom ? 'onSingleClick' : 'onDoubleClick']: (
            e: MouseEvent
        ) => {
            if (pagerIsDragging || isPanningImage) {
                e.stopPropagation();
                return;
            }

            // If tapped while already zoomed-in, zoom out to default scale
            if (scale.get() !== 1) {
                springApi.start(defaultImageTransform);
                return;
            }

            // Zoom-in to origin of click on image
            const { clientX: touchOriginX, clientY: touchOriginY } = e;
            const pinchScale = scale.get() + 1;
            const pinchDelta = pinchScale - scale.get();

            // Calculate the amount of x, y translate offset needed to
            // zoom-in to point as image scale grows
            const [newTranslateX, newTranslateY] = getTranslateOffsetsFromScale(
                {
                    currentTranslate: [translateX.get(), translateY.get()],
                    imageRef,
                    pinchDelta,
                    scale: scale.get(),
                    touchOrigin: [touchOriginX, touchOriginY],
                }
            );

            // Disable dragging in pager
            setDisableDrag(true);
            springApi.start({
                pinching: true,
                scale: pinchScale,
                translateX: newTranslateX,
                translateY: newTranslateY,
            });
        },
        enabled: !inline,
        latency: singleClickToZoom ? 0 : 200,
        ref: imageRef,
    });

    return (
        <AnimatedImage
            className="lightbox-image"
            draggable="false"
            onClick={(e: React.MouseEvent<HTMLImageElement>) => {
                // Don't close lighbox when clicking image
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
            }}
            onDragStart={(e: React.DragEvent<HTMLImageElement>) => {
                // Disable image ghost dragging in firefox
                e.preventDefault();
            }}
            ref={imageRef}
            style={{
                ...imgStyleProp,
                maxHeight: pagerHeight,
                transform: to(
                    [scale, translateX, translateY],
                    (s, x, y) => `translate(${x}px, ${y}px) scale(${s})`
                ),
                ...(isCurrentImage && { willChange: 'transform' }),
            }}
            // Include any valid img html attributes provided in the <Lightbox /> images prop
            {...(restImgProps as React.ComponentProps<typeof animated.img>)}
        />
    );
};

Image.displayName = 'Image';

export default Image;

const AnimatedImage = styled(animated.img)`
    width: auto;
    height: auto;
    max-width: 100%;
    user-select: none;
    touch-action: none;
    ::selection {
        background: none;
    }
`;
