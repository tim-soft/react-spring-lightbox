/* eslint-disable no-shadow */
import * as React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { animated, useTransition } from '@react-spring/web';
import ButtonControl from './LightboxButtonControl';

const ArrowButton = ({ disabled, onClick, position }) => {
    const transitions = useTransition(!disabled, null, {
        enter: { opacity: 1 },
        from: { opacity: 0 },
        leave: { opacity: 0 },
    });

    return transitions.map(
        ({ item, key, props }) =>
            item && (
                <animated.div
                    key={key}
                    style={{
                        ...props,
                        zIndex: 999,
                    }}
                >
                    <Button onClick={onClick} position={position} type="button">
                        {position === 'left' && <IoIosArrowBack />}
                        {position === 'right' && <IoIosArrowForward />}
                    </Button>
                </animated.div>
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

const Button = styled(ButtonControl)`
    position: absolute;
    left: ${({ position }) => (position === 'left' ? 0 : 'unset')};
    right: ${({ position }) => (position === 'right' ? 0 : 'unset')};
`;
