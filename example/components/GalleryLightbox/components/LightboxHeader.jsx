import PropTypes from 'prop-types';
import * as React from 'react';
import { IoIosClose } from 'react-icons/io';

import ButtonControl from './LightboxButtonControl';

const LightboxHeader = ({ currentIndex, galleryTitle, images, onClose }) => (
    <header className="z-10 flex cursor-auto justify-between bg-page/50 py-2.5 pr-0.5 pl-5 text-nav *:h-[inherit]">
        <div className="flex flex-col justify-center border-l-[3px] border-highlight py-2 pr-0 pl-2.5">
            <h2 className="mt-0 mb-[5px] text-[1.5em] font-normal">{galleryTitle}</h2>
            <h4 className="m-0 font-normal text-highlight">{images[currentIndex].caption}</h4>
        </div>

        <div className="flex w-[117px] items-center justify-between">
            <span className="min-w-[60px] text-center whitespace-nowrap">
                {currentIndex + 1} / {images.length}
            </span>
            <ButtonControl
                className="flex h-full items-center justify-center border-l-[3px] border-nav text-inherit"
                onClick={onClose}
            >
                <IoIosClose size={60} />
            </ButtonControl>
        </div>
    </header>
);

LightboxHeader.propTypes = {
    currentIndex: PropTypes.number.isRequired,
    galleryTitle: PropTypes.string.isRequired,
    images: PropTypes.arrayOf(
        PropTypes.shape({
            alt: PropTypes.string.isRequired,
            caption: PropTypes.string.isRequired,
            height: PropTypes.number,
            src: PropTypes.string.isRequired,
            width: PropTypes.number,
        })
    ).isRequired,
    onClose: PropTypes.func.isRequired,
};

export default LightboxHeader;
