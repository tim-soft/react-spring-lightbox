/* eslint-disable react/no-array-index-key */
import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useSprings, animated } from '@react-spring/web';
import { useGesture } from 'react-use-gesture';
import clamp from 'lodash.clamp';
import { useWindowSize } from '../../utils';
import Image from '../Image';

/**
 * Gesture controlled surface that animates prev/next page changes via spring physics.
 *
 * @param {array} images Array of image objects to be shown in Lightbox
 * @param {number} currentIndex Index of image in images array that is currently shown
 * @param {function} onPrev True if this image is currently shown in pager, otherwise false
 * @param {function} onNext Function that can be called to disable dragging in the pager
 * @param {function} onClose Function that closes the Lightbox
 *
 * @see https://github.com/react-spring/react-use-gesture
 * @see https://github.com/react-spring/react-spring
 */
const ImagePager = ({ images, currentIndex, onPrev, onNext, onClose }) => {
  const firstRender = useRef(true);
  const imageStageRef = useRef(
    [...Array(images.length)].map(() => React.createRef())
  );
  const { width: pageWidth } = useWindowSize();
  const [disableDrag, setDisableDrag] = useState(false);

  // Generate page positions based on current index
  const getPagePositions = (i, down = false, xDelta = 0) => {
    const x = (i - currentIndex) * pageWidth + (down ? xDelta : 0);
    if (i < currentIndex - 1 || i > currentIndex + 1)
      return { x, display: 'none' };
    return { x, display: 'block' };
  };

  /**
   * Animates translateX of all images at the same time
   *
   * https://www.react-spring.io/docs/hooks/use-springs
   */
  const [props, set] = useSprings(images.length, getPagePositions);

  // Animate page change if currentIndex changes
  useEffect(() => {
    // No need to set page position for initial render
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    // Update page positions after prev/next page state change
    set(getPagePositions);
  });

  /**
   * Update each Image's visibility and translateX offset during dragging
   *
   * @see https://github.com/react-spring/react-use-gesture
   */
  const bind = useGesture(
    {
      onWheel: ({ distance, velocity, direction: [xDir, yDir], ctrlKey }) => {
        // Disable drag if Image has been zoomed in to allow for panning
        if (ctrlKey || disableDrag || velocity === 0) return;

        const draggedFarEnough = distance > pageWidth / 3;
        const draggedFastEnough = velocity > 1 && distance <= pageWidth / 3;

        // Handle next/prev image from valid drag
        if (draggedFarEnough || draggedFastEnough) {
          const goToIndex = clamp(
            currentIndex + (xDir + yDir > 0 ? -1 : 1),
            0,
            images.length - 1
          );

          if (goToIndex > currentIndex) onNext();
          if (goToIndex < currentIndex) onPrev();
          if (goToIndex === currentIndex)
            set(i => getPagePositions(i, false, 0));
        }
      },
      onWheelEnd: () => {
        set(i => getPagePositions(i, false, 0));
      },
      onDrag: ({
        down,
        movement: [xMovement],
        direction: [xDir],
        velocity,
        distance,
        cancel,
        touches
      }) => {
        // Disable drag if Image has been zoomed in to allow for panning
        if (disableDrag) return;

        const isHorizontalDrag = Math.abs(xDir) > 0.7;
        const draggedFarEnough =
          down && isHorizontalDrag && distance > pageWidth / 3;
        const draggedFastEnough = down && isHorizontalDrag && velocity > 2.5;

        // Handle next/prev image from valid drag
        if (draggedFarEnough || draggedFastEnough) {
          const goToIndex = clamp(
            currentIndex + (xDir > 0 ? -1 : 1),
            0,
            images.length - 1
          );

          // Cancel gesture animation
          cancel();

          if (goToIndex > currentIndex) onNext();
          if (goToIndex < currentIndex) onPrev();
        }

        // Don't move pager during two+ finger touch events, i.e. pinch-zoom
        if (touches > 1) return;

        // Update page x-coordinates for single finger/mouse gestures
        set(i => getPagePositions(i, down, xMovement));
      }
    },
    /**
     * useGesture config
     * @see https://github.com/react-spring/react-use-gesture#usegesture-config
     */
    {
      domTarget: imageStageRef.current[currentIndex],
      event: {
        passive: true,
        capture: false
      }
    }
  );

  /**
   * @see https://github.com/react-spring/react-use-gesture#adding-gestures-to-dom-nodes
   */
  useEffect(bind, [bind, currentIndex]);

  return props.map(({ x, display }, i) => (
    <animated.div
      ref={imageStageRef.current[i]}
      key={i}
      className="lightbox-image-pager"
      style={{
        display,
        transform: x.to(xInterp => `translateX(${xInterp}px)`),
        position: 'absolute',
        height: '100%',
        width: '100%',
        willChange: 'transform',
        touchAction: 'none'
      }}
    >
      <div
        role="presentation"
        className="lightbox-image-container"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          touchAction: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          MsUserSelect: 'none',
          userSelect: 'none'
        }}
        // If the background is clicked, close the lightbox
        onClick={() => x.value === 0 && onClose()}
      >
        <Image
          setDisableDrag={setDisableDrag}
          src={images[i].src}
          alt={images[i].alt}
          isCurrentImage={i === currentIndex}
        />
      </div>
    </animated.div>
  ));
};

ImagePager.propTypes = {
  /* Function that closes the Lightbox */
  onClose: PropTypes.func.isRequired,
  /* Function that triggers ImagePager to move to the previous image */
  onPrev: PropTypes.func.isRequired,
  /* Function that triggers ImagePager to move to the next image */
  onNext: PropTypes.func.isRequired,
  /* Index of image in images array that is currently shown */
  currentIndex: PropTypes.number.isRequired,
  /* Array of images to be shown in Lightbox */
  images: PropTypes.arrayOf(
    PropTypes.shape({
      /* The source URL of this image */
      src: PropTypes.string.isRequired,
      /* The alt attribute for this image */
      alt: PropTypes.string.isRequired
    })
  ).isRequired
};

export default ImagePager;
