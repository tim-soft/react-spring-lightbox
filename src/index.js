import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { ImageStage, PageContainer, CreatePortal } from './components';

/**
 * Gesture controlled lightbox that interpolates animations with spring physics.
 *
 * @param {boolean} isOpen Flag that dictates if the lightbox is open or closed
 * @param {function} onClose Function that closes the Lightbox
 * @param {function} onClickPrev True if this image is currently shown in pager, otherwise false
 * @param {function} onClickNext Function that can be called to disable dragging in the pager
 * @param {number} currentIndex Index of image in images array that is currently shown
 * @param {function} renderHeader A React component that renders above the image pager
 * @param {function} renderFooter A React component that renders below the image pager
 * @param {function} renderPrevButton A React component that is used for previous button in image pager
 * @param {function} renderNextButton A React component that is used for next button in image pager
 * @param {array} images Array of image objects to be shown in Lightbox
 * @param {string} className Classes are applied to the root lightbox component
 * @param {object} style Inline styles are applied to the root lightbox component
 * @param {object} pageTransitionConfig React-Spring useTransition config for page open/close animation
 *
 * @see https://github.com/react-spring/react-use-gesture
 * @see https://github.com/react-spring/react-spring
 */
const Lightbox = ({
  isOpen,
  onClose,
  images,
  currentIndex,
  onClickPrev,
  onClickNext,
  renderHeader,
  renderFooter,
  renderPrevButton,
  renderNextButton,
  className,
  style,
  pageTransitionConfig
}) => {
  // Handle event listeners for keyboard
  useEffect(() => {
    /**
     * Prevent keyboard from controlling background page
     * when lightbox is open
     */
    const preventBackgroundScroll = e => {
      const keysToIgnore = [
        'ArrowUp',
        'ArrowDown',
        'End',
        'Home',
        'PageUp',
        'PageDown'
      ];

      if (isOpen && keysToIgnore.includes(e.key)) e.preventDefault();
    };

    /**
     * Navigate images with arrow keys, close on Esc key
     */
    const handleKeyboardInput = e => {
      if (isOpen) {
        switch (e.key) {
          case 'ArrowLeft':
            onClickPrev();
            break;
          case 'ArrowRight':
            onClickNext();
            break;
          case 'Escape':
            onClose();
            break;
          default:
            e.preventDefault();
            break;
        }
      }
    };

    document.addEventListener('keyup', handleKeyboardInput);
    document.addEventListener('keydown', preventBackgroundScroll);

    return () => {
      document.removeEventListener('keyup', handleKeyboardInput);
      document.removeEventListener('keydown', preventBackgroundScroll);
    };
  });

  return (
    <CreatePortal>
      <PageContainer
        isOpen={isOpen}
        className={className}
        style={style}
        pageTransitionConfig={pageTransitionConfig}
      >
        {renderHeader()}
        <ImageStage
          images={images}
          onClose={onClose}
          currentIndex={currentIndex}
          onClickPrev={onClickPrev}
          onClickNext={onClickNext}
          renderPrevButton={renderPrevButton}
          renderNextButton={renderNextButton}
        />
        {renderFooter()}
      </PageContainer>
    </CreatePortal>
  );
};

Lightbox.propTypes = {
  isOpen: PropTypes.bool.isRequired,
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
  renderHeader: PropTypes.func,
  renderFooter: PropTypes.func,
  renderPrevButton: PropTypes.func,
  renderNextButton: PropTypes.func,
  className: PropTypes.string,
  style: PropTypes.object,
  pageTransitionConfig: PropTypes.object
};

Lightbox.defaultProps = {
  pageTransitionConfig: null,
  className: null,
  style: null,
  renderHeader: () => null,
  renderFooter: () => null,
  renderPrevButton: () => null,
  renderNextButton: () => null
};

export default Lightbox;
