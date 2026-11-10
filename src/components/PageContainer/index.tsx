import { useTransition, animated, config } from '@react-spring/web';
import React from 'react';

import useModalDialog from './useModalDialog';

type IPageContainerProps = {
    'aria-label'?: string;
    'aria-labelledby'?: string;
    /** All child components of Lightbox */
    children: React.ReactNode[];
    /** Classes are applied to the root lightbox component */
    className: string;
    /** Flag that dictates if the lightbox is open or closed */
    isOpen: boolean;
    /** React-Spring useTransition config for page open/close animation */
    pageTransitionConfig: any;
    /** Inline styles are applied to the root lightbox component */
    style: React.CSSProperties;
};

/**
 * Animates the lightbox as it opens/closes
 */
const PageContainer = ({
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    children,
    className,
    isOpen,
    pageTransitionConfig,
    style,
}: IPageContainerProps) => {
    const { dialogRef, wrapTab } = useModalDialog(isOpen);

    const defaultTransition = {
        config: { ...config.default, friction: 32, mass: 1, tension: 320 },
        enter: { opacity: 1, transform: 'scale(1)' },
        from: { opacity: 0, transform: 'scale(0.75)' },
        leave: { opacity: 0, transform: 'scale(0.75)' },
    };

    const transitions = useTransition(isOpen, {
        ...defaultTransition,
        ...pageTransitionConfig,
    });

    return (
        <>
            {transitions(
                (animatedStyles, item) =>
                    item && (
                        <animated.div
                            aria-label={ariaLabel}
                            aria-labelledby={ariaLabelledby}
                            aria-modal="true"
                            className={`lightbox-container${className ? ` ${className}` : ''}`}
                            data-testid="lightbox-container"
                            onKeyDown={wrapTab}
                            ref={dialogRef}
                            // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- resetting the browser border and padding of a <dialog> inline would override a consumer's className
                            role="dialog"
                            style={{
                                bottom: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                left: 0,
                                outline: 'none',
                                position: 'fixed',
                                right: 0,
                                top: 0,
                                zIndex: 400,
                                ...animatedStyles,
                                ...style,
                            }}
                            tabIndex={-1}
                        >
                            {children}
                        </animated.div>
                    )
            )}
        </>
    );
};

export default PageContainer;
