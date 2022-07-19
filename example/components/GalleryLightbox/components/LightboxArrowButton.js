/* eslint-disable no-shadow */
import * as React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { animated, useTransition } from '@react-spring/web';
import ButtonControl from './LightboxButtonControl';

const ArrowButton = ({ className, disabled, onClick, position }) => {
    const transitions = useTransition(!disabled, {
        enter: { opacity: 1 },
        from: { opacity: 0 },
        leave: { opacity: 0 },
    });

    return transitions(
        (props, item) =>
            item && (
                <StyledAnimatedDiv className={className} style={props}>
                    <Button onClick={onClick} position={position} type="button">
                        {position === 'left' && <IoIosArrowBack />}
                        {position === 'right' && <IoIosArrowForward />}
                    </Button>
                </StyledAnimatedDiv>
            )
    );
};

ArrowButton.propTypes = {
    disabled: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
    position: PropTypes.oneOf(['left', 'right']).isRequired,
};

ArrowButton.defaultProps = {
    disabled: false,
};

export default ArrowButton;

const StyledAnimatedDiv = styled(animated.div)`
    z-index: 999;
`;

const Button = styled(ButtonControl)`
    position: absolute;
    top: 0;
    bottom: 0;
    left: ${({ position }) => (position === 'left' ? 0 : 'unset')};
    right: ${({ position }) => (position === 'right' ? 0 : 'unset')};
`;
