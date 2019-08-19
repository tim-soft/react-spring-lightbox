/* eslint-disable no-shadow */
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { animated, useTransition } from '@react-spring/web';
import ButtonControl from './LightboxButtonControl';

const ArrowButton = ({ position, onClick, disabled }) => {
  const transitions = useTransition(!disabled, null, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 }
  });

  return transitions.map(
    ({ item, key, props }) =>
      item && (
        <animated.div
          key={key}
          style={{
            ...props,
            zIndex: 999
          }}
        >
          <Button position={position} type="button" onClick={onClick}>
            {position === 'left' && <IoIosArrowBack />}
            {position === 'right' && <IoIosArrowForward />}
          </Button>
        </animated.div>
      )
  );
};

ArrowButton.propTypes = {
  position: PropTypes.oneOf(['left', 'right']).isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

ArrowButton.defaultProps = {
  disabled: false
};

export default ArrowButton;

const Button = styled(ButtonControl)`
  position: absolute;
  left: ${({ position }) => (position === 'left' ? 0 : 'unset')};
  right: ${({ position }) => (position === 'right' ? 0 : 'unset')};
`;
