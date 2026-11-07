/* eslint-disable no-shadow */
import * as React from 'react';
import PropTypes from 'prop-types';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { animated, useTransition } from '@react-spring/web';
import ButtonControl from './LightboxButtonControl';

const ArrowButton = ({
    className = 'z-[999]',
    disabled = false,
    onClick,
    position,
}) => {
    const transitions = useTransition(!disabled, {
        enter: { opacity: 1 },
        from: { opacity: 0 },
        leave: { opacity: 0 },
    });

    return transitions(
        (props, item) =>
            item && (
                <animated.div className={className} style={props}>
                    <ButtonControl
                        className={`absolute top-1/2 -translate-y-1/2 text-content ${
                            position === 'left' ? 'left-0' : 'right-0'
                        }`}
                        onClick={onClick}
                    >
                        {position === 'left' && (
                            <IoIosArrowBack className="inline align-baseline" />
                        )}
                        {position === 'right' && (
                            <IoIosArrowForward className="inline align-baseline" />
                        )}
                    </ButtonControl>
                </animated.div>
            ),
    );
};

ArrowButton.propTypes = {
    className: PropTypes.string,
    disabled: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
    position: PropTypes.oneOf(['left', 'right']).isRequired,
};

export default ArrowButton;
