import React from 'react';
import { useTransition, animated, config } from '@react-spring/web';

type IPageContainerProps = {
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
    children,
    className,
    isOpen,
    pageTransitionConfig,
    style,
}: IPageContainerProps) => {
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
                            className={`lightbox-container${
                                className ? ` ${className}` : ''
                            }`}
                            data-testid="lightbox-container"
                            style={{
                                bottom: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                left: 0,
                                position: 'fixed',
                                right: 0,
                                top: 0,
                                zIndex: 400,
                                ...animatedStyles,
                                ...style,
                            }}
                        >
                            {children}
                        </animated.div>
                    ),
            )}
        </>
    );
};

export default PageContainer;
