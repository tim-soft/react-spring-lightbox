import PropTypes from 'prop-types';
import * as React from 'react';

/**
 * A borderless icon button that turns aquamarine on hover and focus. Callers
 * set its color, since two color classes on one element would conflict.
 */
const LightboxButtonControl = ({ className = '', ...props }) => (
    <button
        className={`z-10 m-0 cursor-pointer bg-transparent p-0 text-[50px] transition-[color] duration-200 ease-linear hover:text-highlight focus:text-highlight focus:outline-none ${className}`}
        type="button"
        {...props}
    />
);

LightboxButtonControl.propTypes = {
    className: PropTypes.string,
};

export default LightboxButtonControl;
