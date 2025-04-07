import { animated, useSprings } from '@react-spring/web';
import { useGesture } from 'react-use-gesture';
import Image from '../Image';
import VideoEmbed from '../../../VideoEmbed';
import React, { useEffect, useRef, useState } from 'react';
import styled, { AnyStyledComponent } from 'styled-components';
import type { ImagesList } from '../../../../types/ImagesList';

type IPager = {
    /** Index of image/video in images array that is currently shown */
    currentIndex: number;
    /** image/video stage height */
    imageStageHeight: number;
    /** image/video stage width */
    imageStageWidth: number;
    /** Array of image objects to be shown in Lightbox */
    images: ImagesList;
    /** Affects Width calculation method, depending on whether the Lightbox is Inline or not */
    inline: boolean;
    /** Function that closes the Lightbox */
    onClose?: () => void;
    /** Function that can be called to disable dragging in the pager */
    onNext: () => void;
    /** True if this image/video is currently shown in pager, otherwise false */
    onPrev: () => void;
    /** A React component that renders inside the image/video stage, useful for making overlays */
    renderImageOverlay: () => React.ReactNode;
    /** Whether to show video instead of images */
    showVideo?: boolean;
    /** Overrides the default behavior of double clicking causing an image zoom to a single click */
    singleClickToZoom: boolean;
    /** Video ID from YouTube URL */
    videoId?: string;
};

/**
 * Gesture controlled surface that animates prev/next page changes via spring physics for both images and videos.
 */
const Pager = ({
    currentIndex,
    images,
    imageStageHeight,
    imageStageWidth,
    inline,
    onClose,
    onNext,
    onPrev,
    renderImageOverlay,
    showVideo = false,
    singleClickToZoom,
    videoId,
}: IPager) => {
    const firstRender = useRef(true);
    const [disableDrag, setDisableDrag] = useState<boolean>(false);
    const [pagerHeight, setPagerHeight] = useState<'100%' | number>('100%');
    const [isDragging, setIsDragging] = useState<boolean>(false);

    //Determine the absolute height of the pager
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
     * Animates translateX of all pages at the same time
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
     * Update each page's visibility and translateX offset during dragging
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
                event,
                movement: [xMovement],
                touches,
                velocity,
            }) => {
                // Ignore drags that start on the video iframe
                if (
                    showVideo &&
                    event.target instanceof HTMLElement &&
                    event.target.tagName === 'IFRAME'
                ) {
                    return;
                }

                // Disable drag if content is being interacted with
                if (disableDrag || xMovement === 0) {
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

                // Handle next/prev page from valid drag
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

                // Don't move pager during two+ finger touch events
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
                    // Add small timeout buffer to prevent event handlers from firing in child elements
                    setTimeout(() => setIsDragging(false), 100);
                }
            },
            onWheel: ({ ctrlKey, direction: [xDir, yDir], velocity }) => {
                // Disable drag if content is being interacted with
                if (ctrlKey || disableDrag || velocity === 0) {
                    return;
                }

                if (!isDragging) {
                    setIsDragging(true);
                }

                const draggedFastEnough = velocity > 1.1;

                // Handle next/prev page from valid drag
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
                // Add small timeout buffer to prevent event handlers from firing in child elements
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
        <PagerContainer>
            {pagerSprings.map(({ display, x }, i) => (
                <AnimatedPager
                    $inline={inline}
                    {...bind()}
                    className="lightbox-pager"
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
                        display,
                        transform: x.to(
                            (xInterp: number) => `translateX(${xInterp}px)`,
                        ),
                    }}
                >
                    <PagerContentWrapper>
                        <PagerInnerContentWrapper>
                            <ContentContainer
                                $inline={inline}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.nativeEvent.stopImmediatePropagation();
                                }}
                            >
                                {showVideo && videoId ? (
                                    <VideoEmbed
                                        inline={inline}
                                        onNext={onNext}
                                        onPrev={onPrev}
                                        onVideoInteraction={(isInteracting) =>
                                            setDisableDrag(isInteracting)
                                        }
                                        style={{
                                            height: '100%',
                                            width: '100%',
                                        }}
                                        videoId={videoId}
                                    />
                                ) : (
                                    <Image
                                        imgProps={images[i]}
                                        inline={inline}
                                        isCurrentImage={i === currentIndex}
                                        pagerHeight={pagerHeight}
                                        pagerIsDragging={isDragging}
                                        setDisableDrag={setDisableDrag}
                                        singleClickToZoom={singleClickToZoom}
                                    />
                                )}
                                {renderImageOverlay()}
                            </ContentContainer>
                        </PagerInnerContentWrapper>
                    </PagerContentWrapper>
                </AnimatedPager>
            ))}
        </PagerContainer>
    );
};

Pager.displayName = 'Pager';

export default Pager;

const PagerContainer = styled.div`
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

const AnimatedPager = styled(animated.span as AnyStyledComponent)<{
    $inline: boolean;
}>`
    position: absolute;
    top: 0px;
    left: 0px;
    right: 0px;
    bottom: 0px;
    height: 100%;
    width: 100%;
    will-change: transform;
    touch-action: ${({ $inline }) => (!$inline ? 'none' : 'pan-y')};
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;

const ContentContainer = styled.div<{ $inline: boolean }>`
    position: relative;
    touch-action: ${({ $inline }) => (!$inline ? 'none' : 'pan-y')};
    user-select: none;
    display: flex;
    justify-content: center;
    width: 100%;
`;
