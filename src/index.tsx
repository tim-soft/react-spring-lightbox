import React, { useEffect } from 'react';
import { ImageStage, PageContainer, CreatePortal } from './components';

type ILightboxProps = {
    className?: string;
    currentIndex: number;
    images: {
        alt: string;
        caption: string;
        height: number;
        src: string;
        width: number;
    }[];
    isOpen: boolean;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
    pageTransitionConfig?: any;
    renderFooter?: () => React.ReactNode;
    renderHeader?: () => React.ReactNode;
    renderImageOverlay?: () => React.ReactNode;
    renderNextButton?: () => React.ReactNode;
    renderPrevButton?: () => React.ReactNode;
    singleClickToZoom?: boolean;
    style?: React.CSSProperties;
};
/**
 * Gesture controlled lightbox that interpolates animations with spring physics.
 *
 * @param {boolean} isOpen Flag that dictates if the lightbox is open or closed
 * @param {function} onClose Function that closes the Lightbox
 * @param {function} onPrev Function that changes currentIndex to previous image in images
 * @param {function} onNext Function that changes currentIndex to next image in images
 * @param {number} currentIndex Index of image in images array that is currently shown
 * @param {function} renderHeader A React component that renders above the image pager
 * @param {function} renderFooter A React component that renders below the image pager
 * @param {function} renderImageOverlay A React component that renders inside the image stage, useful for making overlays over the image
 * @param {function} renderPrevButton A React component that is used for previous button in image pager
 * @param {function} renderNextButton A React component that is used for next button in image pager
 * @param {array} images Array of image objects to be shown in Lightbox
 * @param {string} className Classes are applied to the root lightbox component
 * @param {object} style Inline styles are applied to the root lightbox component
 * @param {object} pageTransitionConfig React-Spring useTransition config for page open/close animation
 * @param {boolean} singleClickToZoom Overrides the default behavior of double clicking causing an image zoom to a single click
 *
 * @see https://github.com/react-spring/react-use-gesture
 * @see https://github.com/react-spring/react-spring
 */
const Lightbox = ({
    isOpen,
    onClose,
    images = [],
    currentIndex,
    onPrev,
    onNext,
    renderHeader = () => null,
    renderFooter = () => null,
    renderPrevButton = () => null,
    renderNextButton = () => null,
    renderImageOverlay = () => null,
    className = '',
    singleClickToZoom = false,
    style = {},
    pageTransitionConfig = null,
}: ILightboxProps) => {
    // Handle event listeners for keyboard
    useEffect(() => {
        /**
         * Prevent keyboard from controlling background page
         * when lightbox is open
         */
        const preventBackgroundScroll = (e: KeyboardEvent) => {
            const keysToIgnore = [
                'ArrowUp',
                'ArrowDown',
                'End',
                'Home',
                'PageUp',
                'PageDown',
            ];

            if (isOpen && keysToIgnore.includes(e.key)) e.preventDefault();
        };

        /**
         * Navigate images with arrow keys, close on Esc key
         */
        const handleKeyboardInput = (e: KeyboardEvent) => {
            if (isOpen) {
                switch (e.key) {
                    case 'ArrowLeft':
                        onPrev();
                        break;
                    case 'ArrowRight':
                        onNext();
                        break;
                    case 'Escape':
                        onClose();
                        break;
                    default:
                        e.preventDefault();
                        break;
                }
            }
        };

        document.addEventListener('keyup', handleKeyboardInput);
        document.addEventListener('keydown', preventBackgroundScroll);

        return () => {
            document.removeEventListener('keyup', handleKeyboardInput);
            document.removeEventListener('keydown', preventBackgroundScroll);
        };
    });

    return (
        <CreatePortal>
            <PageContainer
                className={className}
                isOpen={isOpen}
                pageTransitionConfig={pageTransitionConfig}
                style={style}
            >
                {renderHeader()}
                <ImageStage
                    currentIndex={currentIndex}
                    images={images}
                    onClose={onClose}
                    onNext={onNext}
                    onPrev={onPrev}
                    renderImageOverlay={renderImageOverlay}
                    renderNextButton={renderNextButton}
                    renderPrevButton={renderPrevButton}
                    singleClickToZoom={singleClickToZoom}
                />
                {renderFooter()}
            </PageContainer>
        </CreatePortal>
    );
};

export default Lightbox;
