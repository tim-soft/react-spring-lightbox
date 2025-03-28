import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { useGesture } from 'react-use-gesture';

type VideoEmbedProps = {
    /** Optional aspect ratio (default 16:9) */
    aspectRatio?: string;
    /** Optional CSS class name */
    className?: string;
    /** Affects Width calculation method, depending on whether the Lightbox is Inline or not */
    inline?: boolean;
    /** Function to navigate to next item */
    onNext?: () => void;
    /** Function to navigate to previous item */
    onPrev?: () => void;
    /** Optional inline styles */
    style?: React.CSSProperties;
    /** Optional title for the iframe (default: "YouTube video player") */
    title?: string;
    /** Video ID from YouTube URL */
    videoId: string;
};

/**
 * Renders a YouTube video embed with responsive sizing and gesture navigation
 */
const VideoEmbed = ({
    aspectRatio = '16:9',
    className = '',
    inline = false,
    onNext,
    onPrev,
    style = {},
    title = 'YouTube video player',
    videoId,
}: VideoEmbedProps) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    // Calculate padding based on aspect ratio
    const [width, height] = aspectRatio.split(':').map(Number);
    const paddingTop = `${(height / width) * 100}%`;

    // Gesture handling for navigation
    const bind = useGesture(
        {
            onDrag: ({
                active,
                cancel,
                direction: [xDir],
                distance,
                down,
                event,
                velocity,
            }) => {
                // Ignore drags that start on the video iframe
                if (!(event.target instanceof HTMLElement)) return;
                if (event.target.tagName === 'IFRAME') return;

                if (!isDragging) {
                    setIsDragging(true);
                }

                const containerWidth = wrapperRef.current?.offsetWidth || 0;
                const isHorizontalDrag = Math.abs(xDir) > 0.7;
                const draggedFarEnough =
                    down && isHorizontalDrag && distance > containerWidth / 3.5;
                const draggedFastEnough =
                    down && isHorizontalDrag && velocity > 2;

                if ((draggedFarEnough || draggedFastEnough) && active) {
                    // Cancel gesture event
                    cancel();

                    if (xDir > 0 && onPrev) {
                        onPrev();
                    } else if (xDir < 0 && onNext) {
                        onNext();
                    }
                }
            },
            onDragEnd: () => {
                if (isDragging) {
                    // Add small timeout buffer to prevent event handlers from firing in child elements
                    setTimeout(() => setIsDragging(false), 100);
                }
            },
            onWheel: ({ direction: [, yDir], velocity }) => {
                if (!isDragging) {
                    setIsDragging(true);
                }

                const draggedFastEnough = velocity > 1.1;

                if (draggedFastEnough) {
                    if (yDir > 0 && onNext) {
                        onNext();
                    } else if (yDir < 0 && onPrev) {
                        onPrev();
                    }
                }
            },
            onWheelEnd: () => {
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
        <VideoWrapper
            ref={wrapperRef}
            {...bind()}
            $paddingTop={paddingTop}
            className={`video-embed-wrapper${className ? ` ${className}` : ''}`}
            style={style}
        >
            <StyledIframe
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                src={`https://www.youtube.com/embed/${videoId}?autoplay=0&mute=1`}
                title={title}
            />
        </VideoWrapper>
    );
};

export default VideoEmbed;

const VideoWrapper = styled.div<{ $paddingTop: string }>`
    position: relative;
    width: 100%;
    height: 0;
    padding-top: ${({ $paddingTop }) => $paddingTop};
    touch-action: pan-y pinch-zoom;
    user-select: none;
`;

const StyledIframe = styled.iframe`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 0;
    pointer-events: auto;
`;
