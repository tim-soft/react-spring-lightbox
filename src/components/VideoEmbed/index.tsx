import React, { useRef, useState, useEffect } from 'react';
import styled from 'styled-components';
import { useGesture } from 'react-use-gesture';
import YouTube, { YouTubeEvent } from 'react-youtube';

type VideoEmbedProps = {
    /** Optional CSS class name */
    className?: string;
    /** Affects Width calculation method, depending on whether the Lightbox is Inline or not */
    inline?: boolean;
    /** Function to navigate to next item */
    onNext?: () => void;
    /** Callback for YouTube player events */
    onPlayerEvent?: (event: {
        data: any;
        player: YouTubeEvent['target'];
        type:
            | 'ready'
            | 'play'
            | 'pause'
            | 'end'
            | 'error'
            | 'stateChange'
            | 'playbackRateChange'
            | 'playbackQualityChange';
    }) => void;
    /** Function to navigate to previous item */
    onPrev?: () => void;
    /** Callback when video interaction starts/ends */
    onVideoInteraction?: (isInteracting: boolean) => void;
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
    className = '',
    inline = false,
    onNext,
    onPlayerEvent,
    onPrev,
    onVideoInteraction,
    style = {},
    title = 'YouTube video player',
    videoId,
}: VideoEmbedProps) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    // Notify parent of video interaction state changes
    useEffect(() => {
        onVideoInteraction?.(isDragging);
    }, [isDragging, onVideoInteraction]);

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

    const opts = {
        height: '480',
        playerVars: {
            autoplay: 0,
            modestbranding: 1,
            rel: 0,
        },
        width: '853',
    };

    return (
        <VideoWrapper
            ref={wrapperRef}
            {...bind()}
            className={`video-wrapper${className ? ` ${className}` : ''}`}
            style={style}
        >
            <YouTube
                className="youtube-player"
                onEnd={(event: YouTubeEvent) =>
                    onPlayerEvent?.({
                        data: event,
                        player: event.target,
                        type: 'end',
                    })
                }
                onError={(event: YouTubeEvent) =>
                    onPlayerEvent?.({
                        data: event,
                        player: event.target,
                        type: 'error',
                    })
                }
                onPause={(event: YouTubeEvent) =>
                    onPlayerEvent?.({
                        data: event,
                        player: event.target,
                        type: 'pause',
                    })
                }
                onPlay={(event: YouTubeEvent) =>
                    onPlayerEvent?.({
                        data: event,
                        player: event.target,
                        type: 'play',
                    })
                }
                onPlaybackQualityChange={(event: YouTubeEvent) =>
                    onPlayerEvent?.({
                        data: event,
                        player: event.target,
                        type: 'playbackQualityChange',
                    })
                }
                onPlaybackRateChange={(event: YouTubeEvent) =>
                    onPlayerEvent?.({
                        data: event,
                        player: event.target,
                        type: 'playbackRateChange',
                    })
                }
                onReady={(event: YouTubeEvent) =>
                    onPlayerEvent?.({
                        data: event,
                        player: event.target,
                        type: 'ready',
                    })
                }
                onStateChange={(event: YouTubeEvent) =>
                    onPlayerEvent?.({
                        data: event,
                        player: event.target,
                        type: 'stateChange',
                    })
                }
                opts={opts}
                title={title}
                videoId={videoId}
            />
        </VideoWrapper>
    );
};

export default VideoEmbed;

const VideoWrapper = styled.div`
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;

    .youtube-player {
        border: 0;
        width: 853px;
        height: 480px;
    }
`;
