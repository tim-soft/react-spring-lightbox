import React, { useEffect } from 'react';
import { ImageStage, PageContainer, CreatePortal } from './components';
import type { ImagesList } from './types/ImagesList';

export type ImagesListType = ImagesList;

type ILightboxProps = {
    /** classnames are applied to the root lightbox component */
    className?: string;
    /** Index of image in images array that is currently shown */
    currentIndex: number;
    /** Array of images to be shown in Lightbox, each image object may contain any valid 'img' attribute with the exceptions of 'draggable', 'onClick', 'onDragStart' and 'ref' */
    images: ImagesList;
    /** Determines whether the Lightbox returns just an Inline carousel (ImageStage) */
    inline?: boolean;
    /** Flag that dictates if the lightbox is open or closed */
    isOpen: boolean;
    /** Function that closes the Lightbox */
    onClose?: () => void;
    /** Function that changes currentIndex to next image in images */
    onNext: () => void;
    /** Function that changes currentIndex to previous image in images */
    onPrev: () => void;
    /** React-Spring useTransition config for page open/close animation */
    pageTransitionConfig?: any;
    /** A React component that renders below the image pager */
    renderFooter?: () => React.ReactNode;
    /** A React component that renders above the image pager */
    renderHeader?: () => React.ReactNode;
    /** A React component that renders inside the image stage, useful for making overlays over the image */
    renderImageOverlay?: () => React.ReactNode;
    /** A React component that is used for next button in image pager */
    renderNextButton?: ({ canNext }: { canNext: boolean }) => React.ReactNode;
    /** A React component that is used for previous button in image pager */
    renderPrevButton?: ({ canPrev }: { canPrev: boolean }) => React.ReactNode;
    /** Overrides the default behavior of double clicking causing an image zoom to a single click */
    singleClickToZoom?: boolean;
    /** Inline styles that are applied to the root lightbox component */
    style?: React.CSSProperties;
};

/**
 * Gesture controlled lightbox that interpolates animations with spring physics.
 *
 * Demos and docs:
 * @see https://timellenberger.com/libraries/react-spring-lightbox
 *
 * GitHub repo:
 * @see https://github.com/tim-soft/react-spring-lightbox
 *
 * Built with:
 * @see https://github.com/react-spring/react-use-gesture
 * @see https://github.com/react-spring/react-spring
 * @see https://github.com/styled-components/styled-components
 */
const Lightbox = ({
    className = '',
    currentIndex,
    images = [],
    inline = false,
    isOpen,
    onClose,
    onNext,
    onPrev,
    pageTransitionConfig = null,
    renderFooter = () => null,
    renderHeader = () => null,
    renderImageOverlay = () => null,
    renderNextButton = () => null,
    renderPrevButton = () => null,
    singleClickToZoom = false,
    style = {},
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
                        onClose && onClose();
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

    const imageStage = (
        <ImageStage
            currentIndex={currentIndex}
            images={images}
            inline={inline}
            onClose={onClose}
            onNext={onNext}
            onPrev={onPrev}
            renderImageOverlay={renderImageOverlay}
            renderNextButton={renderNextButton}
            renderPrevButton={renderPrevButton}
            singleClickToZoom={singleClickToZoom}
        />
    );

    if (inline) {
        return imageStage;
    }

    return (
        <CreatePortal>
            <PageContainer
                className={className}
                isOpen={isOpen}
                pageTransitionConfig={pageTransitionConfig}
                style={style}
            >
                {renderHeader()}
                {imageStage}
                {renderFooter()}
            </PageContainer>
        </CreatePortal>
    );
};

export default Lightbox;
