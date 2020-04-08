/* eslint-disable react/no-array-index-key */
import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useSprings, animated } from '@react-spring/web';
import { useGesture } from 'react-use-gesture';
import styled from 'styled-components';
import { useWindowSize } from '../../utils';
import Image from '../Image';

/**
 * Gesture controlled surface that animates prev/next page changes via spring physics.
 *
 * @param {array} images Array of image objects to be shown in Lightbox
 * @param {number} currentIndex Index of image in images array that is currently shown
 * @param {function} onPrev True if this image is currently shown in pager, otherwise false
 * @param {function} onNext Function that can be called to disable dragging in the pager
 * @param {function} onClose Function that closes the Lightbox
 * @param {function} renderImageOverlay A React component that renders inside the image stage, useful for making overlays over the image
 * @param {boolean} singleClickToZoom Overrides the default behavior of double clicking causing an image zoom to a single click
 *
 * @see https://github.com/react-spring/react-use-gesture
 * @see https://github.com/react-spring/react-spring
 */
const ImagePager = ({
    images,
    currentIndex,
    onPrev,
    onNext,
    onClose,
    renderImageOverlay,
    singleClickToZoom
}) => {
    const firstRender = useRef(true);
    const imageStageRef = useRef(
        [...Array(images.length)].map(() => React.createRef())
    );
    const { height: windowHeight, width: pageWidth } = useWindowSize();
    const [disableDrag, setDisableDrag] = useState(false);
    const [pagerHeight, setPagerHeight] = useState('100%');
    const [isDragging, setIsDragging] = useState(false);

    // Generate page positions based on current index
    const getPagePositions = (i, down = false, xDelta = 0) => {
        const x = (i - currentIndex) * pageWidth + (down ? xDelta : 0);
        if (i < currentIndex - 1 || i > currentIndex + 1)
            return { x, display: 'none' };
        return { x, display: 'flex' };
    };

    /**
     * Animates translateX of all images at the same time
     *
     * @see https://www.react-spring.io/docs/hooks/use-springs
     */
    const [props, set] = useSprings(images.length, getPagePositions);

    // Determine the absolute height of the image pager
    useEffect(() => {
        const currPagerHeight =
            imageStageRef.current[currentIndex].current.clientHeight - 50;
        if (pagerHeight !== currPagerHeight) setPagerHeight(currPagerHeight);
    }, [currentIndex, pagerHeight, windowHeight]);

    // Animate page change if currentIndex changes
    useEffect(() => {
        // No need to set page position for initial render
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }

        // Update page positions after prev/next page state change
        set(getPagePositions);
    });

    /**
     * Update each Image's visibility and translateX offset during dragging
     *
     * @see https://github.com/react-spring/react-use-gesture
     */
    const bind = useGesture(
        {
            onWheel: ({
                distance,
                velocity,
                direction: [xDir, yDir],
                ctrlKey
            }) => {
                // Disable drag if Image has been zoomed in to allow for panning
                if (ctrlKey || disableDrag || velocity === 0) return;

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
                set(i => getPagePositions(i, false, 0));
                setIsDragging(false);
            },
            onDrag: ({
                down,
                movement: [xMovement],
                direction: [xDir],
                velocity,
                distance,
                cancel,
                touches
            }) => {
                // Disable drag if Image has been zoomed in to allow for panning
                if (disableDrag || xMovement === 0) return;
                if (!isDragging) setIsDragging(true);

                const isHorizontalDrag = Math.abs(xDir) > 0.7;
                const draggedFarEnough =
                    down && isHorizontalDrag && distance > pageWidth / 3.5;
                const draggedFastEnough =
                    down && isHorizontalDrag && velocity > 2;

                // Handle next/prev image from valid drag
                if (draggedFarEnough || draggedFastEnough) {
                    const goToIndex = xDir > 0 ? -1 : 1;

                    // Cancel gesture animation
                    cancel();

                    if (goToIndex > 0) onNext();
                    else if (goToIndex < 0) onPrev();
                }

                // Don't move pager during two+ finger touch events, i.e. pinch-zoom
                if (touches > 1) return;

                // Update page x-coordinates for single finger/mouse gestures
                set(i => getPagePositions(i, down, xMovement));
            },
            onDragEnd: () => setIsDragging(false)
        },
        /**
         * useGesture config
         * @see https://github.com/react-spring/react-use-gesture#usegesture-config
         */
        {
            domTarget: imageStageRef.current[currentIndex],
            event: {
                passive: true,
                capture: false
            }
        }
    );

    /**
     * @see https://github.com/react-spring/react-use-gesture#adding-gestures-to-dom-nodes
     */
    useEffect(bind, [bind, currentIndex]);

    return props.map(({ x, display }, i) => (
        <AnimatedImagePager
            role="presentation"
            ref={imageStageRef.current[i]}
            key={i}
            className="lightbox-image-pager"
            style={{
                display,
                transform: x.to(xInterp => `translateX(${xInterp}px)`)
            }}
            onClick={() => Math.abs(x.value) < 1 && !disableDrag && onClose()}
        >
            <PagerContentWrapper>
                <PagerInnerContentWrapper>
                    <ImageContainer
                        onClick={e => {
                            e.stopPropagation();
                            e.nativeEvent.stopImmediatePropagation();
                        }}
                    >
                        <Image
                            setDisableDrag={setDisableDrag}
                            src={images[i].src}
                            alt={images[i].alt}
                            pagerHeight={pagerHeight}
                            isCurrentImage={i === currentIndex}
                            pagerIsDragging={isDragging}
                            singleClickToZoom={singleClickToZoom}
                        />
                        {renderImageOverlay()}
                    </ImageContainer>
                </PagerInnerContentWrapper>
            </PagerContentWrapper>
        </AnimatedImagePager>
    ));
};

ImagePager.propTypes = {
    /* Function that closes the Lightbox */
    onClose: PropTypes.func.isRequired,
    /* Function that triggers ImagePager to move to the previous image */
    onPrev: PropTypes.func.isRequired,
    /* Function that triggers ImagePager to move to the next image */
    onNext: PropTypes.func.isRequired,
    /* Index of image in images array that is currently shown */
    currentIndex: PropTypes.number.isRequired,
    /* Array of images to be shown in Lightbox */
    images: PropTypes.arrayOf(
        PropTypes.shape({
            /* The source URL of this image */
            src: PropTypes.string.isRequired,
            /* The alt attribute for this image */
            alt: PropTypes.string.isRequired
        })
    ).isRequired,
    /* A React component that renders inside the image stage, useful for making overlays over the image */
    renderImageOverlay: PropTypes.func.isRequired,
    /* Fixed height of the image stage, used to restrict maximum height of images */
    pagerHeight: PropTypes.number.isRequired,
    /* Overrides the default behavior of double clicking causing an image zoom to a single click */
    singleClickToZoom: PropTypes.isRequired
};

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
