import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import VideoLightboxWrapper from './VideoLightboxWrapper';

// Mock the VideoLightbox component
jest.mock('../../../example/components/VideoLightbox', () => {
    return function MockVideoLightbox({ galleryTitle, images }: any) {
        const [currentIndex, setCurrentIndex] = React.useState(0);

        const handleNext = () => {
            if (currentIndex < images.length - 1) {
                setCurrentIndex(currentIndex + 1);
            }
        };

        const handlePrev = () => {
            if (currentIndex > 0) {
                setCurrentIndex(currentIndex - 1);
            }
        };

        return (
            <div data-testid="mock-video-lightbox">
                <div data-testid="gallery-title">{galleryTitle}</div>
                <div data-testid="images-count">{images.length}</div>
                <button aria-label="next" onClick={handleNext}>
                    Next
                </button>
                <button aria-label="previous" onClick={handlePrev}>
                    Previous
                </button>
                {images[currentIndex].type === 'video' ? (
                    <div data-testid="video-player">Video Content</div>
                ) : (
                    <div data-testid="image-content">Image Content</div>
                )}
            </div>
        );
    };
});

describe('VideoLightboxWrapper', () => {
    const mockImages = [
        {
            alt: 'Sample Video 1',
            caption: 'First Video',
            src: 'https://picsum.photos/800/600?random=2',
            type: 'video' as const,
            videoId: 'dQw4w9WgXcQ',
        },
        {
            alt: 'Sample Image 1',
            caption: 'First Image',
            src: 'https://picsum.photos/800/600?random=1',
        },
    ];

    test('renders with both video and image content', () => {
        render(
            <VideoLightboxWrapper
                galleryTitle="Test Gallery"
                images={mockImages}
            />,
        );

        // Check if the mock component is rendered
        expect(screen.getByTestId('mock-video-lightbox')).toBeInTheDocument();
        expect(screen.getByTestId('gallery-title')).toHaveTextContent(
            'Test Gallery',
        );
        expect(screen.getByTestId('images-count')).toHaveTextContent('2');
    });

    test('handles navigation between items', () => {
        render(
            <VideoLightboxWrapper
                galleryTitle="Test Gallery"
                images={mockImages}
            />,
        );

        // Find and click next button
        const nextButton = screen.getByRole('button', { name: /next/i });
        fireEvent.click(nextButton);

        // Find and click previous button
        const prevButton = screen.getByRole('button', { name: /previous/i });
        fireEvent.click(prevButton);
    });

    test('switches between video and image content', () => {
        render(
            <VideoLightboxWrapper
                galleryTitle="Test Gallery"
                images={mockImages}
            />,
        );

        // Initially should show video content
        expect(screen.getByTestId('video-player')).toBeInTheDocument();

        // Navigate to next item (image)
        const nextButton = screen.getByRole('button', { name: /next/i });
        fireEvent.click(nextButton);

        // Should now show image content
        expect(screen.getByTestId('image-content')).toBeInTheDocument();
    });
});
