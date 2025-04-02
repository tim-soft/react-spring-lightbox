import * as React from 'react';
import VideoLightbox from '../components/VideoLightbox';
import styled from 'styled-components';

const images = [
    {
        alt: 'Sample Video 1',
        caption: 'First Video',
        src: 'https://picsum.photos/800/600?random=2',
        type: 'video',
        videoId: 'dQw4w9WgXcQ', // Rick Astley - Never Gonna Give You Up
    },
    {
        alt: 'Sample Image 1',
        caption: 'First Image',
        src: 'https://picsum.photos/800/600?random=1',
    },
    {
        alt: 'Sample Image 2',
        caption: 'Second Image',
        src: 'https://picsum.photos/800/600?random=3',
    },
];

const VideoLightboxPage = () => {
    return (
        <PageContainer>
            <VideoLightbox
                galleryTitle="Video Lightbox Example"
                images={images}
            />
        </PageContainer>
    );
};

export default VideoLightboxPage;

const PageContainer = styled.div`
    padding: 32px;
    max-width: 1200px;
    margin: 0 auto;
`;
