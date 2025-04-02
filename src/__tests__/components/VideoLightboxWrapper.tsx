import * as React from 'react';
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
    type?: 'image'; // optional since it's the default
}

type Image = VideoImage | ImageImage;

interface VideoLightboxProps {
    galleryTitle?: string;
    images: Image[];
}

const VideoLightboxWrapper: React.FC<VideoLightboxProps> = (props) => {
    return <VideoLightbox {...props} />;
};

export default VideoLightboxWrapper;
