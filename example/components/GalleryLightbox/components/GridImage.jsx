import PropTypes from 'prop-types';
import * as React from 'react';

/**
 * A single image element in a masonry style image grid
 */
const GridImage = ({ index, key, left, onClick, photo, top }) => {
    const { alt, caption, height, src, width } = photo;
    const open = (event) => onClick(event, { index });
    return (
        <div
            className="absolute box-content block cursor-pointer border-2 border-transparent outline-none hover:border-highlight focus-visible:border-highlight"
            key={`${key}-${index}`}
            onClick={open}
            onKeyDown={(event) => {
                // Enter and Space press a button, and Space would otherwise scroll the page
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    open(event);
                }
            }}
            // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- the tile holds block content, which a <button> can't contain
            role="button"
            style={{ height, left, top, width }}
            tabIndex={0}
        >
            <div className="relative h-full overflow-hidden">
                <img
                    alt={alt}
                    className="absolute h-[inherit] w-[inherit]"
                    src={src}
                />
                <div className="absolute bottom-0 w-full bg-accent text-highlight">
                    <h4 className="my-[1em] text-center font-bold">{caption}</h4>
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
