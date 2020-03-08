import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useSpring, animated, to, config } from '@react-spring/web';
import { useGesture } from 'react-use-gesture';
import styled from 'styled-components';
import {
    useDoubleClick,
    imageIsOutOfBounds,
    getTranslateOffsetsFromScale
} from '../../utils';

/**
 * Animates pinch-zoom + panning on image using spring physics
 *
 * @param {string} src The source URL of this image
 * @param {string} alt The alt attribute for this image
 * @param {boolean} isCurrentImage True if this image is currently shown in pager, otherwise false
 * @param {function} setDisableDrag Function that can be called to disable dragging in the pager
 * @param {number} pagerHeight Fixed height of the image stage, used to restrict maximum height of images
 *
 * @see https://github.com/react-spring/react-use-gesture
 * @see https://github.com/react-spring/react-spring
 */
const Image = ({ src, alt, pagerHeight, isCurrentImage, setDisableDrag }) => {
    const imageRef = useRef();
    const defaultImageTransform = () => ({
        scale: 1,
        translateX: 0,
        translateY: 0,
        config: { ...config.default, precision: 0.01 }
    });

    /**
     * Animates scale and translate offsets of Image as they change in gestures
     *
     * @see https://www.react-spring.io/docs/hooks/use-spring
     */
    const [{ scale, translateX, translateY }, set] = useSpring(() => ({
        ...defaultImageTransform(),
        onFrame: f => {
            if (f.scale < 1 || !f.pinching) set(defaultImageTransform);

            // Prevent dragging image out of viewport
            if (f.scale > 1 && imageIsOutOfBounds(imageRef))
                set(defaultImageTransform());
        },
        // Enable dragging in ImagePager if image is at the default size
        onRest: f => {
            if (f.scale === 1) setDisableDrag(false);
        }
    }));

    // Reset scale of this image when dragging to new image in ImagePager
    useEffect(() => {
        if (!isCurrentImage) set(defaultImageTransform);
    });

    /**
     * Update Image scale and translate offsets during pinch/pan gestures
     *
     * @see https://github.com/react-spring/react-use-gesture#usegesture-hook-supporting-multiple-gestures-at-once
     */
    const bind = useGesture(
        {
            onPinch: ({
                movement: [xMovement],
                origin: [touchOriginX, touchOriginY],
                event,
                ctrlKey,
                last,
                cancel
            }) => {
                // Don't calculate new translate offsets on final frame
                if (last) {
                    cancel();
                    return;
                }

                // Speed up pinch zoom when using mouse versus touch
                const SCALE_FACTOR = ctrlKey ? 1000 : 250;
                const pinchScale = scale.value + xMovement / SCALE_FACTOR;
                const pinchDelta = pinchScale - scale.value;
                const { clientX, clientY } = event;

                // Calculate the amount of x, y translate offset needed to
                // zoom-in to point as image scale grows
                const [
                    newTranslateX,
                    newTranslateY
                ] = getTranslateOffsetsFromScale({
                    imageRef,
                    scale: scale.value,
                    pinchDelta,
                    currentTranslate: [translateX.value, translateY.value],
                    // Use the [x, y] coords of mouse if a trackpad or ctrl + wheel event
                    // Otherwise use touch origin
                    touchOrigin: ctrlKey
                        ? [clientX, clientY]
                        : [touchOriginX, touchOriginY]
                });

                // Restrict the amount of zoom between half and 3x image size
                if (pinchScale < 0.5) set({ scale: 0.5, pinching: true });
                else if (pinchScale > 3.0) set({ scale: 3.0, pinching: true });
                else
                    set({
                        scale: pinchScale,
                        translateX: newTranslateX,
                        translateY: newTranslateY,
                        pinching: true
                    });
            },
            onPinchEnd: () => {
                if (scale.value > 1) setDisableDrag(true);
                else set(defaultImageTransform);
            },
            onDrag: ({
                movement: [xMovement, yMovement],
                pinching,
                event,
                cancel,
                first,
                memo = null
            }) => {
                if (event.touches && event.touches.length > 1) return;
                if (pinching || scale.value <= 1) return;

                // Prevent dragging image out of viewport
                if (scale.value > 1 && imageIsOutOfBounds(imageRef)) cancel();
                else {
                    if (first) {
                        return {
                            initialTranslateX: translateX.value,
                            initialTranslateY: translateY.value
                        };
                    }

                    // Translate image from dragging
                    set({
                        translateX: memo.initialTranslateX + xMovement,
                        translateY: memo.initialTranslateY + yMovement
                    });

                    return memo;
                }
            }
        },
        /**
         * useGesture config
         * @see https://github.com/react-spring/react-use-gesture#usegesture-config
         */
        {
            domTarget: imageRef,
            event: {
                passive: false
            }
        }
    );

    /**
     * @see https://github.com/react-spring/react-use-gesture#adding-gestures-to-dom-nodes
     */
    useEffect(bind, [bind]);

    // Handle double-tap on image
    useDoubleClick({
        onDoubleClick: e => {
            // If double-tapped while already zoomed-in, zoom out to default scale
            if (scale.value !== 1) {
                set(defaultImageTransform);
                return;
            }

            // Zoom-in to origin of click on image
            const { clientX: touchOriginX, clientY: touchOriginY } = e;
            const pinchScale = scale.value + 1;
            const pinchDelta = pinchScale - scale.value;

            // Calculate the amount of x, y translate offset needed to
            // zoom-in to point as image scale grows
            const [newTranslateX, newTranslateY] = getTranslateOffsetsFromScale(
                {
                    imageRef,
                    scale: scale.value,
                    pinchDelta,
                    currentTranslate: [translateX.value, translateY.value],
                    touchOrigin: [touchOriginX, touchOriginY]
                }
            );

            // Disable dragging in pager
            setDisableDrag(true);
            set({
                scale: pinchScale,
                translateX: newTranslateX,
                translateY: newTranslateY,
                pinching: true
            });
        },
        ref: imageRef,
        latency: 250
    });

    return (
        <AnimatedImage
            ref={imageRef}
            className="lightbox-image"
            style={{
                transform: to(
                    [scale, translateX, translateY],
                    (s, x, y) => `translate(${x}px, ${y}px) scale(${s})`
                ),
                maxHeight: pagerHeight,
                ...(isCurrentImage && { willChange: 'transform' })
            }}
            src={src}
            alt={alt}
            draggable="false"
            onDragStart={e => {
                // Disable image ghost dragging in firefox
                e.preventDefault();
            }}
            onClick={e => {
                // Don't close lighbox when clicking image
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
            }}
        />
    );
};

Image.propTypes = {
    /* The source URL of this image */
    src: PropTypes.string.isRequired,
    /* The alt attribute for this image */
    alt: PropTypes.string.isRequired,
    /* True if this image is currently shown in pager, otherwise false */
    isCurrentImage: PropTypes.bool.isRequired,
    /* Function that can be called to disable dragging in the pager */
    setDisableDrag: PropTypes.func.isRequired,
    /* Fixed height of the image stage, used to restrict maximum height of images */
    pagerHeight: PropTypes.number.isRequired
};

export default Image;

const AnimatedImage = styled(animated.img)`
    width: auto;
    max-width: 100%;
    user-select: none;
    ::selection {
        background: none;
    }
`;
