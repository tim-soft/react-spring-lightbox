import * as React from 'react';
import PropTypes from 'prop-types';

/**
 * A single image element in a masonry style image grid
 */
const GridImage = ({ index, key, left, onClick, photo, top }) => {
    const { alt, caption, height, src, width } = photo;
    return (
        <div
            className="absolute box-content block cursor-pointer border-2 border-transparent hover:border-highlight"
            key={`${key}-${index}`}
            onClick={(e) => onClick(e, { index })}
            style={{ height, left, top, width }}
        >
            <div className="relative h-full overflow-hidden">
                <img
                    alt={alt}
                    className="absolute h-[inherit] w-[inherit]"
                    src={src}
                />
                <div className="absolute bottom-0 w-full bg-accent text-highlight">
                    <h4 className="my-[1em] text-center font-bold">
                        {caption}
                    </h4>
                </div>
            </div>
        </div>
    );
};

GridImage.propTypes = {
    containerHeight: PropTypes.number.isRequired,
    index: PropTypes.number.isRequired,
    key: PropTypes.string.isRequired,
    left: PropTypes.number.isRequired,
    onClick: PropTypes.func.isRequired,
    photo: PropTypes.shape({
        alt: PropTypes.string.isRequired,
        caption: PropTypes.string.isRequired,
        height: PropTypes.number.isRequired,
        src: PropTypes.string.isRequired,
        width: PropTypes.number.isRequired,
    }).isRequired,
    top: PropTypes.number.isRequired,
};

export default GridImage;
