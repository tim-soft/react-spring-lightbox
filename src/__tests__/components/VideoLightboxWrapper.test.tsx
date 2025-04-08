import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import VideoLightboxWrapper from './VideoLightboxWrapper';

// Mock YouTube player instance
const mockYouTubePlayer = {
    getCurrentTime: jest.fn().mockReturnValue(30),
    getDuration: jest.fn().mockReturnValue(180),
    pauseVideo: jest.fn(),
    playVideo: jest.fn(),
};

// Mock the VideoLightbox component
jest.mock('../../../example/components/VideoLightbox', () => {
    return function MockVideoLightbox({
        galleryTitle,
        images,
        onPlayerEvent,
    }: {
        galleryTitle?: string;
        images: Array<{
            alt: string;
            src: string;
            type: 'video' | 'image';
            videoId?: string;
        }>;
        onPlayerEvent?: (event: {
            data: any;
            player: any;
            type: string;
        }) => void;
    }) {
        const [currentIndex, setCurrentIndex] = React.useState(0);

        React.useEffect(() => {
            if (images[currentIndex].type === 'video' && onPlayerEvent) {
                // Simulate ready event
                onPlayerEvent({
                    data: null,
                    player: mockYouTubePlayer,
                    type: 'ready',
                });
            }
        }, [currentIndex]);

        const handleNext = () => {
            if (currentIndex < images.length - 1) {
                if (images[currentIndex].type === 'video' && onPlayerEvent) {
                    // Simulate pause event when navigating away
                    onPlayerEvent({
                        data: null,
                        player: mockYouTubePlayer,
                        type: 'pause',
                    });
                }
                setCurrentIndex(currentIndex + 1);
            }
        };

        return (
            <div data-testid="mock-video-lightbox">
                <div data-testid="gallery-title">{galleryTitle}</div>
                <div data-testid="current-content">
                    {images[currentIndex].type === 'video' ? (
                        <div data-testid="video-player">
                            Video: {images[currentIndex].videoId}
                        </div>
                    ) : (
                        <div data-testid="image-content">
                            Image: {images[currentIndex].src}
                        </div>
                    )}
                </div>
                <button onClick={handleNext}>Next</button>
            </div>
        );
    };
});

describe('VideoLightboxWrapper', () => {
    const mockImages = [
        {
            alt: 'Sample Video',
            src: 'video-thumbnail.jpg',
            type: 'video' as const,
            videoId: 'test123',
        },
        {
            alt: 'Sample Image',
            src: 'test-image.jpg',
            type: 'image' as const,
        },
    ];

    const mockPlayerEvents = jest.fn();

    test('handles video player events', () => {
        render(
            <VideoLightboxWrapper
                images={mockImages}
                onPlayerEvent={mockPlayerEvents}
            />,
        );

        // Should receive ready event when mounting with video
        expect(mockPlayerEvents).toHaveBeenCalledWith(
            expect.objectContaining({
                player: expect.any(Object),
                type: 'ready',
            }),
        );

        // Test navigation from video to image
        fireEvent.click(screen.getByText('Next'));

        // Should receive pause event when navigating away from video
        expect(mockPlayerEvents).toHaveBeenCalledWith(
            expect.objectContaining({
                player: expect.any(Object),
                type: 'pause',
            }),
        );
    });

    test('handles navigation between items', () => {
        render(
            <VideoLightboxWrapper
                images={mockImages}
                onPlayerEvent={mockPlayerEvents}
            />,
        );

        // Initial state should show video
        expect(screen.getByTestId('video-player')).toBeInTheDocument();
        expect(screen.getByText('Video: test123')).toBeInTheDocument();

        // Navigate to image
        fireEvent.click(screen.getByText('Next'));
        expect(screen.getByTestId('image-content')).toBeInTheDocument();
        expect(screen.getByText('Image: test-image.jpg')).toBeInTheDocument();

        // Try to navigate past last item (should stay on last item)
        fireEvent.click(screen.getByText('Next'));
        expect(screen.getByTestId('image-content')).toBeInTheDocument();
    });

    test('switches between video and image content', () => {
        render(
            <VideoLightboxWrapper
                images={mockImages}
                onPlayerEvent={mockPlayerEvents}
            />,
        );

        // Verify initial video content
        expect(screen.getByTestId('video-player')).toBeInTheDocument();
        expect(screen.queryByTestId('image-content')).not.toBeInTheDocument();

        // Switch to image content
        fireEvent.click(screen.getByText('Next'));
        expect(screen.getByTestId('image-content')).toBeInTheDocument();
        expect(screen.queryByTestId('video-player')).not.toBeInTheDocument();
    });
});
