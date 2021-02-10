import React, { useEffect, useState, useRef } from 'react';
import { useSpring, animated, to, config } from '@react-spring/web';
import { useGesture } from 'react-use-gesture';
import styled from 'styled-components';
import {
    useDoubleClick,
    imageIsOutOfBounds,
    getTranslateOffsetsFromScale,
} from '../../utils';

type IImageProps = {
    alt: string;
    isCurrentImage: boolean;
    pagerHeight: '100%' | number;
    pagerIsDragging: boolean;
    setDisableDrag: (disable: boolean) => void;
    singleClickToZoom: boolean;
    src: string;
};

/**
 * Animates pinch-zoom + panning on image using spring physics
 *
 * @param {string} src The source URL of this image
 * @param {string} alt The alt attribute for this image
 * @param {boolean} isCurrentImage True if this image is currently shown in pager, otherwise false
 * @param {function} setDisableDrag Function that can be called to disable dragging in the pager
 * @param {number} pagerHeight Fixed height of the image stage, used to restrict maximum height of images
 * @param {boolean} singleClickToZoom Overrides the default behavior of double clicking causing an image zoom to a single click
 * @param {boolean} pagerIsDragging Indicates parent ImagePager is in a state of dragging, if true click to zoom is disabled
 *
 * @see https://github.com/react-spring/react-use-gesture
 * @see https://github.com/react-spring/react-spring
 */
const Image = ({
    alt,
    isCurrentImage,
    pagerHeight,
    pagerIsDragging,
    setDisableDrag,
    singleClickToZoom,
    src,
}: IImageProps) => {
    const [isPanningImage, setIsPanningImage] = useState<boolean>(false);
    const imageRef = useRef<HTMLImageElement>(null);
    const defaultImageTransform = () => ({
        config: { ...config.default, precision: 0.01 },
        scale: 1,
        translateX: 0,
        translateY: 0,
    });

    /**
     * Animates scale and translate offsets of Image as they change in gestures
     *
     * @see https://www.react-spring.io/docs/hooks/use-spring
     */
    const [{ scale, translateX, translateY }, set] = useSpring(() => ({
        ...defaultImageTransform(),
        onFrame: (f: { pinching: boolean; scale: number }) => {
            if (f.scale < 1 || !f.pinching) {
                set(defaultImageTransform());
            }

            // Prevent dragging image out of viewport
            if (f.scale > 1 && imageIsOutOfBounds(imageRef)) {
                set(defaultImageTransform());
            }
        },
        // Enable dragging in ImagePager if image is at the default size
        onRest: (f: { pinching: boolean; scale: number }) => {
            if (f.scale === 1) {
                setDisableDrag(false);
            }
        },
    }));

    // Reset scale of this image when dragging to new image in ImagePager
    useEffect(() => {
        if (!isCurrentImage && scale.getValue() !== 1) {
            set(defaultImageTransform());
        }
    }, [isCurrentImage, scale, set]);

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
                event,
                cancel,
                first,
                memo = { initialTranslateX: 0, initialTranslateY: 0 },
            }) => {
                if (pagerIsDragging || scale.getValue() === 1) {
                    return;
                }

                // Disable click to zoom during drag
                if (xMovement && yMovement && !isPanningImage) {
                    setIsPanningImage(true);
                }

                if (event.touches && event.touches.length > 1) return;
                if (pinching || scale.getValue() <= 1) return;

                // Prevent dragging image out of viewport
                if (scale.getValue() > 1 && imageIsOutOfBounds(imageRef)) {
                    cancel();
                    return;
                } else {
                    if (first) {
                        return {
                            initialTranslateX: translateX.getValue(),
                            initialTranslateY: translateY.getValue(),
                        };
                    }

                    // Translate image from dragging
                    set({
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
                if (xMovement && !isPanningImage) setIsPanningImage(true);

                // Don't calculate new translate offsets on final frame
                if (last) {
                    cancel();
                    return;
                }

                // Speed up pinch zoom when using mouse versus touch
                const SCALE_FACTOR = ctrlKey ? 1000 : 250;
                const pinchScale = scale.getValue() + xMovement / SCALE_FACTOR;
                const pinchDelta = pinchScale - scale.getValue();
                const { clientX, clientY } = event;

                // Calculate the amount of x, y translate offset needed to
                // zoom-in to point as image scale grows
                const [
                    newTranslateX,
                    newTranslateY,
                ] = getTranslateOffsetsFromScale({
                    currentTranslate: [
                        translateX.getValue(),
                        translateY.getValue(),
                    ],
                    imageRef,
                    pinchDelta,
                    scale: scale.getValue(),
                    // Use the [x, y] coords of mouse if a trackpad or ctrl + wheel event
                    // Otherwise use touch origin
                    touchOrigin: ctrlKey
                        ? [clientX, clientY]
                        : [touchOriginX, touchOriginY],
                });

                // Restrict the amount of zoom between half and 3x image size
                if (pinchScale < 0.5) set({ pinching: true, scale: 0.5 });
                else if (pinchScale > 3.0) set({ pinching: true, scale: 3.0 });
                else
                    set({
                        pinching: true,
                        scale: pinchScale,
                        translateX: newTranslateX,
                        translateY: newTranslateY,
                    });
            },
            onPinchEnd: () => {
                if (!pagerIsDragging) {
                    if (scale.getValue() > 1) setDisableDrag(true);
                    else set(defaultImageTransform());
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
            if (scale.getValue() !== 1) {
                set(defaultImageTransform());
                return;
            }

            // Zoom-in to origin of click on image
            const { clientX: touchOriginX, clientY: touchOriginY } = e;
            const pinchScale = scale.getValue() + 1;
            const pinchDelta = pinchScale - scale.getValue();

            // Calculate the amount of x, y translate offset needed to
            // zoom-in to point as image scale grows
            const [newTranslateX, newTranslateY] = getTranslateOffsetsFromScale(
                {
                    currentTranslate: [
                        translateX.getValue(),
                        translateY.getValue(),
                    ],
                    imageRef,
                    pinchDelta,
                    scale: scale.getValue(),
                    touchOrigin: [touchOriginX, touchOriginY],
                }
            );

            // Disable dragging in pager
            setDisableDrag(true);
            set({
                pinching: true,
                scale: pinchScale,
                translateX: newTranslateX,
                translateY: newTranslateY,
            });
        },
        latency: singleClickToZoom ? 0 : 200,
        ref: imageRef,
    });

    return (
        <AnimatedImage
            alt={alt}
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
            // @ts-ignore
            ref={imageRef}
            src={src}
            // @ts-ignore
            style={{
                maxHeight: pagerHeight,
                transform: to(
                    [scale, translateX, translateY],
                    (s, x, y) => `translate(${x}px, ${y}px) scale(${s})`
                ),
                ...(isCurrentImage && { willChange: 'transform' }),
            }}
        />
    );
};

Image.displayName = 'Image';

export default Image;

const AnimatedImage = styled(animated.img)`
    width: auto;
    max-width: 100%;
    user-select: none;
    touch-action: none;
    ::selection {
        background: none;
    }
`;
