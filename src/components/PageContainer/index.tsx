import React from 'react';
import { useTransition, animated, config } from '@react-spring/web';
import styled, { AnyStyledComponent } from 'styled-components';

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
                        <AnimatedPageContainer
                            className={`lightbox-container${
                                className ? ` ${className}` : ''
                            }`}
                            data-testid="lightbox-container"
                            style={{ ...animatedStyles, ...style }}
                        >
                            {children}
                        </AnimatedPageContainer>
                    ),
            )}
        </>
    );
};

export default PageContainer;

const AnimatedPageContainer = styled(animated.div as AnyStyledComponent)`
    display: flex;
    flex-direction: column;
    position: fixed;
    z-index: 400;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
`;
