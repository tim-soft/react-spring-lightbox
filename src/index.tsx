import React, { useEffect } from 'react';

import type { ImagesList } from './types/ImagesList';

import { ImageStage, PageContainer, CreatePortal } from './components';

export type ImagesListType = ImagesList;

const TEXT_FIELD = 'input, select, textarea, [contenteditable]:not([contenteditable="false"])';

const PRESSED_BY_SPACE = 'button, summary';

const SCROLL_KEYS = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'];

type ILightboxProps = {
    /** Accessible name of the lightbox dialog, used when there is no visible title */
    'aria-label'?: string;
    /** Id of the element that holds the lightbox dialog's visible title */
    'aria-labelledby'?: string;
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
 * @see https://github.com/pmndrs/use-gesture
 * @see https://github.com/react-spring/react-spring
 */
const Lightbox = ({
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    className = '',
    currentIndex,
    // oxlint-disable-next-line typescript/no-useless-default-assignment -- JavaScript callers can leave out images
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
    const onKey = (event: KeyboardEvent) => {
        const target = event.target as Element;
        // Safari fires compositionend before the keydown that ends a composition, and marks that key
        // only with keyCode 229
        if (!isOpen || event.defaultPrevented || event.isComposing || event.keyCode === 229) {
            return;
        }
        const inTextField = target.closest(TEXT_FIELD) !== null;
        const shortcut = event.altKey || event.ctrlKey || event.metaKey;

        if (!event.repeat && !shortcut) {
            if (event.key === 'Escape') {
                onClose?.();
            } else if (event.key === 'ArrowLeft' && !inTextField) {
                onPrev();
            } else if (event.key === 'ArrowRight' && !inTextField) {
                onNext();
            }
        }
        // Inert content still scrolls. These keys would scroll the page behind the modal, also with
        // Alt, Ctrl, or Cmd held, as Cmd+↓ does on macOS. Space scrolls unless one of those is held
        // or Space presses the focused control.
        const scrollsPage =
            event.key === ' '
                ? !shortcut && target.closest(PRESSED_BY_SPACE) === null
                : SCROLL_KEYS.includes(event.key);
        if (!inline && !inTextField && scrollsPage) {
            event.preventDefault();
        }
    };

    // A native listener on the dialog would run before React calls the handlers of the controls
    // inside it, so only a React handler sees a control claim a key with preventDefault()
    const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
        // React also bubbles keys from content that a control inside portals out of the lightbox
        if (event.currentTarget.contains(event.target as Node)) {
            onKey(event.nativeEvent);
        }
    };

    // A control that turns disabled or leaves the page while it has focus, as Next does on the last
    // image, drops focus to <body>. Nothing behind the open modal can take focus, so those keys are its own.
    useEffect(() => {
        if (!isOpen || inline) {
            return undefined;
        }
        const onKeyWithoutFocus = (event: KeyboardEvent) => {
            if (event.target === document.body) {
                onKey(event);
            }
        };
        document.addEventListener('keydown', onKeyWithoutFocus);
        return () => document.removeEventListener('keydown', onKeyWithoutFocus);
    });

    const imageStage = (
        <ImageStage
            currentIndex={currentIndex}
            images={images}
            inline={inline}
            onClose={onClose}
            onKeyDown={inline ? onKeyDown : undefined}
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
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledby}
                className={className}
                isOpen={isOpen}
                onKeyDown={onKeyDown}
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
