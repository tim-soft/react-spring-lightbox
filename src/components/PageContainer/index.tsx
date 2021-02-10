import React from 'react';
import { useTransition, animated, config } from '@react-spring/web';
import styled from 'styled-components';

type IPageContainerProps = {
    children: React.ReactNode[];
    className: string;
    isOpen: boolean;
    pageTransitionConfig: any;
    style: React.CSSProperties;
};

/**
 * Animates the lightbox as it opens/closes
 *
 * @param {ReactNode} children All child components of Lightbox
 * @param {boolean} isOpen Flag that dictates if the lightbox is open or closed
 * @param {string} className Classes are applied to the root lightbox component
 * @param {object} style Inline styles are applied to the root lightbox component
 * @param {object} pageTransitionConfig React-Spring useTransition config for page open/close animation
 *
 * @see https://www.react-spring.io/docs/hooks/use-transition
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

    const transitions = useTransition(isOpen, null, {
        ...defaultTransition,
        ...pageTransitionConfig,
    });

    return (
        <>
            {transitions.map(
                ({ item, key, props }) =>
                    item && (
                        <AnimatedPageContainer
                            className={`lightbox-container${
                                className ? ` ${className}` : ''
                            }`}
                            key={key}
                            // @ts-ignore
                            style={{ ...props, ...style }}
                        >
                            {children}
                        </AnimatedPageContainer>
                    )
            )}
        </>
    );
};

export default PageContainer;

const AnimatedPageContainer = styled(animated.div)`
    display: flex;
    flex-direction: column;
    position: fixed;
    z-index: 400;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
`;
