import React from 'react';
import styled from 'styled-components';

type VideoEmbedProps = {
    /** Optional aspect ratio (default 16:9) */
    aspectRatio?: string;
    /** Optional CSS class name */
    className?: string;
    /** Optional inline styles */
    style?: React.CSSProperties;
    /** Optional title for the iframe (default: "YouTube video player") */
    title?: string;
    /** Video ID from YouTube URL */
    videoId: string;
};

/**
 * Renders a YouTube video embed with responsive sizing
 */
const VideoEmbed = ({
    aspectRatio = '16:9',
    className = '',
    style = {},
    title = 'YouTube video player',
    videoId,
}: VideoEmbedProps) => {
    // Calculate padding based on aspect ratio
    const [width, height] = aspectRatio.split(':').map(Number);
    const paddingTop = `${(height / width) * 100}%`;

    return (
        <VideoWrapper
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
`;

const StyledIframe = styled.iframe`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 0;
`;
