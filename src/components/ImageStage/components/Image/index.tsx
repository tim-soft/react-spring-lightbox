import * as React from 'react';
import { useSpring, animated, to, config } from '@react-spring/web';
import { useGesture } from '@use-gesture/react';
import styled from 'styled-components';
import {
    useDoubleClick,
    imageIsOutOfBounds,
    getTranslateOffsetsFromScale,
} from '../../utils';
import type { ImagesListItem } from '../../../../types/ImagesList';

const defaultConfig = config.default;
const panningConfig = {
    tension: 180,
    friction: 17,
    velocity: 13 * 0.001,
};
const pinchingConfig = {
    tension: 180,
    friction: 17,
    clamp: true,
};

const defaultImageTransform = {
    config: defaultConfig,
    pinching: false,
    scale: 1,
    translateX: 0,
    translateY: 0,
};

type IImageProps = {
    /** Any valid <img /> props to pass to the lightbox img element ie src, alt, caption etc*/
    imgProps: ImagesListItem;
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
    isCurrentImage,
    pagerHeight,
    pagerIsDragging,
    setDisableDrag,
    singleClickToZoom,
}: IImageProps) => {
    const isPanningImage = React.useRef<boolean>(false);
    const imageRef = React.useRef<HTMLImageElement>(null);

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
    React.useEffect(() => {
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
                if (xMovement && yMovement && !isPanningImage.current) {
                    isPanningImage.current = true;
                }

                if (touches > 1) return;
                if (pinching || scale.get() <= 1) return;

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
                        config: panningConfig,
                        translateX: memo.initialTranslateX + xMovement,
                        translateY: memo.initialTranslateY + yMovement,
                    });

                    return memo;
                }
            },
            onDragEnd: ({ memo }) => {
                springApi.start({
                    config: defaultConfig,
                });

                if (memo !== undefined) {
                    // Add small timeout to prevent onClick handler from firing after drag
                    setTimeout(() => {
                        isPanningImage.current = false;
                    }, 100);
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
                console.log('mousewheel is not firing!');
                if (pagerIsDragging) {
                    return;
                }

                // Prevent ImagePager from registering isDragging
                setDisableDrag(true);

                // Disable click to zoom during pinch
                if (xMovement && !isPanningImage.current) {
                    isPanningImage.current = false;
                }

                // Don't calculate new translate offsets on final frame
                if (last) {
                    cancel();
                    return;
                }

                /**
                 * Calculate touch origin for pinch/zoom
                 *
                 * if event is a touch event (React.TouchEvent<Element>, TouchEvent or WebKitGestureEvent) use touchOriginX/Y
                 * if event is a wheel event (React.WheelEvent<Element> or WheelEvent) use the mouse cursor's clientX/Y
                 */
                let isScrollWheel = false;
                let touchOrigin: [touchOriginX: number, touchOriginY: number] =
                    [touchOriginX, touchOriginY];
                if ('clientX' in event && 'clientY' in event && ctrlKey) {
                    touchOrigin = [event.clientX, event.clientY];
                    isScrollWheel = true;
                }

                // Speed up pinch zoom when using mouse versus touch
                let pinchScale = 0;
                if (isScrollWheel) {
                    pinchScale = scale.get() + xMovement / 5000;
                } else {
                    pinchScale = scale.get() + xMovement;
                }

                const pinchDelta = pinchScale - scale.get();

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

                const nextConfig = isScrollWheel
                    ? defaultConfig
                    : pinchingConfig;

                // Restrict the amount of zoom between half and 3x image size
                if (pinchScale < 0.5)
                    springApi.start({
                        scale: 0.5,
                    });
                else if (pinchScale > 3.0)
                    springApi.start({
                        scale: 3.0,
                    });
                else
                    springApi.start({
                        config: nextConfig,
                        pinching: true,
                        scale: pinchScale,
                        translateX: newTranslateX,
                        translateY: newTranslateY,
                    });
            },
            onPinchEnd: () => {
                if (!pagerIsDragging) {
                    if (scale.get() > 1) setDisableDrag(true);
                    else springApi.start(defaultImageTransform);
                    // Add small timeout to prevent onClick handler from firing after panning
                    setTimeout(() => {
                        isPanningImage.current = false;
                    }, 100);
                }
            },
        },
        /**
         * useGesture config
         * @see https://github.com/react-spring/react-use-gesture#usegesture-config
         */
        {
            target: imageRef,
            drag: {
                filterTaps: true,
            },
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
            if (pagerIsDragging || isPanningImage.current) {
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
    max-width: 100%;
    user-select: none;
    touch-action: none;
    ::selection {
        background: none;
    }
`;
