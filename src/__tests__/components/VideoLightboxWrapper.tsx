import * as React from 'react';
import { YouTubeEvent } from 'react-youtube';
import VideoLightbox from '../../../example/components/VideoLightbox';

interface BaseImage {
    alt: string;
    caption?: string;
    src: string;
}

interface VideoImage extends BaseImage {
    type: 'video';
    videoId: string;
}

interface ImageImage extends BaseImage {
    type?: 'image';
}

interface VideoLightboxProps {
    galleryTitle?: string;
    images: (VideoImage | ImageImage)[];
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
}

const VideoLightboxWrapper: React.FC<VideoLightboxProps> = (props) => {
    return <VideoLightbox {...props} />;
};

export default VideoLightboxWrapper;
