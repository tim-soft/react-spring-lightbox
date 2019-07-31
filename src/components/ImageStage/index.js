/* eslint-disable no-shadow */
import React from 'react';
import PropTypes from 'prop-types';
import ImagePager from './components/ImagePager';

/**
 * Containing element for ImagePager and prev/next button controls
 *
 * @param {array} images Array of image objects to be shown in Lightbox
 * @param {number} currentIndex Index of image in images array that is currently shown
 * @param {function} onClickPrev True if this image is currently shown in pager, otherwise false
 * @param {function} onClickNext Function that can be called to disable dragging in the pager
 * @param {function} renderPrevButton A React component that is used for previous button in image pager
 * @param {function} renderNextButton A React component that is used for next button in image pager
 */
const ImageStage = ({
  images,
  currentIndex,
  onClickPrev,
  onClickNext,
  onClose,
  renderPrevButton,
  renderNextButton
}) => {
  // Extra sanity check that the next/prev image exists before moving to it
  const canPrev = currentIndex > 0;
  const canNext = currentIndex + 1 < images.length;
  const prev = () => canPrev && onClickPrev();
  const next = () => canNext && onClickNext();

  return (
    <div
      style={{
        flexGrow: 1,
        margin: '25px 0',
        position: 'relative',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      {renderPrevButton({ canPrev })}

      <ImagePager
        images={images}
        currentIndex={currentIndex}
        onClose={onClose}
        onClickNext={next}
        onClickPrev={prev}
      />

      {renderNextButton({ canNext })}
    </div>
  );
};

ImageStage.propTypes = {
  onClose: PropTypes.func.isRequired,
  onClickPrev: PropTypes.func.isRequired,
  onClickNext: PropTypes.func.isRequired,
  currentIndex: PropTypes.number.isRequired,
  images: PropTypes.arrayOf(
    PropTypes.shape({
      src: PropTypes.string.isRequired,
      caption: PropTypes.string.isRequired,
      alt: PropTypes.string.isRequired,
      width: PropTypes.number,
      height: PropTypes.number
    })
  ).isRequired,
  renderPrevButton: PropTypes.func.isRequired,
  renderNextButton: PropTypes.func.isRequired
};

export default ImageStage;
