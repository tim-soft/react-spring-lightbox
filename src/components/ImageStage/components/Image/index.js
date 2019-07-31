import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useSpring, animated, to, config } from 'react-spring';
import { useGesture } from 'react-use-gesture';
import {
  useDoubleClick,
  imageIsOutOfBounds,
  getTranslateOffsetsFromScale
} from '../../utils';

/**
 * Animates pinch-zoom + panning on image using spring physics
 *
 * @param {string} src The source URL of this image
 * @param {string} alt The alt attribute for this image
 * @param {boolean} isCurrentImage True if this image is currently shown in pager, otherwise false
 * @param {function} setDisableDrag Function that can be called to disable dragging in the pager
 *
 * @see https://github.com/react-spring/react-use-gesture
 * @see https://github.com/react-spring/react-spring
 */
const Image = ({ src, alt, isCurrentImage, setDisableDrag }) => {
  const imageRef = useRef();
  const defaultImageTransform = () => ({
    scale: 1,
    translateX: 0,
    translateY: 0,
    config: { ...config.default, precision: 0.01 }
  });

  /**
   * Animates scale and translate offsets of Image as they change in gestures
   *
   * @see https://www.react-spring.io/docs/hooks/use-spring
   */
  const [{ scale, translateX, translateY }, set] = useSpring(() => ({
    ...defaultImageTransform(),
    onFrame: f => {
      if (f.scale < 1 || !f.pinching) set(defaultImageTransform);

      // Prevent dragging image out of viewport
      if (f.scale > 1 && imageIsOutOfBounds(imageRef))
        set(defaultImageTransform());
    },
    // Enable dragging in ImagePager if image is at the default size
    onRest: f => {
      if (f.scale === 1) setDisableDrag(false);
    }
  }));

  // Reset scale of this image when dragging to new image in ImagePager
  useEffect(() => {
    if (!isCurrentImage) set(defaultImageTransform);
  });

  /**
   * Update Image scale and translate offsets during pinch/pan gestures
   *
   * @see https://github.com/react-spring/react-use-gesture#usegesture-hook-supporting-multiple-gestures-at-once
   */
  const bind = useGesture(
    {
      onPinch: ({
        delta: [deltaDist],
        origin: [touchOriginX, touchOriginY]
      }) => {
        const pinchScale = scale.value + deltaDist * 0.004;
        const pinchDelta = pinchScale - scale.value;

        // Calculate the amount of x, y translate offset needed to
        // zoom-in to point as image scale grows
        const [newTranslateX, newTranslateY] = getTranslateOffsetsFromScale({
          imageRef,
          scale: scale.value,
          pinchDelta,
          currentTranslate: [translateX.value, translateY.value],
          touchOrigin: [touchOriginX, touchOriginY]
        });

        // Restrict the amount of zoom between half and 3x image size
        if (pinchScale < 0.5) set({ scale: 0.5, pinching: true });
        else if (pinchScale > 3.0) set({ scale: 3.0, pinching: true });
        else
          set({
            scale: pinchScale,
            translateX: newTranslateX,
            translateY: newTranslateY,
            pinching: true
          });
      },
      onPinchEnd: () => {
        if (scale.value > 1) setDisableDrag(true);
        else set(defaultImageTransform);
      },
      onDrag: ({ delta: [xDelta, yDelta], pinching, event, cancel }) => {
        if (event.touches && event.touches.length > 1) return;
        if (pinching || scale.value <= 1) return;

        // Prevent dragging image out of viewport
        if (scale.value > 1 && imageIsOutOfBounds(imageRef)) cancel();
        else
          set({
            translateX: translateX.value + xDelta / 3,
            translateY: translateY.value + yDelta / 3
          });
      }
    },
    /**
     * useGesture config
     * @see https://github.com/react-spring/react-use-gesture#usegesture-config
     */
    { domTarget: imageRef }
  );

  // Handle double-tap on image
  useDoubleClick({
    onDoubleClick: e => {
      // If double-tapped while already zoomed-in, zoom out to default scale
      if (scale.value !== 1) {
        set(defaultImageTransform);

        return;
      }

      // Zoom-in to origin of click on image
      const { clientX: touchOriginX, clientY: touchOriginY } = e;
      const pinchScale = scale.value + 1;
      const pinchDelta = pinchScale - scale.value;

      // Calculate the amount of x, y translate offset needed to
      // zoom-in to point as image scale grows
      const [newTranslateX, newTranslateY] = getTranslateOffsetsFromScale({
        imageRef,
        scale: scale.value,
        pinchDelta,
        currentTranslate: [translateX.value, translateY.value],
        touchOrigin: [touchOriginX, touchOriginY]
      });

      // Disable dragging in pager
      setDisableDrag(true);
      set({
        scale: pinchScale,
        translateX: newTranslateX,
        translateY: newTranslateY,
        pinching: true
      });
    },
    ref: imageRef,
    latency: 250
  });

  return (
    <animated.img
      {...bind()}
      ref={imageRef}
      style={{
        transform: to(
          [scale, translateX, translateY],
          (s, x, y) => `translate(${x}px, ${y}px) scale(${s})`
        ),
        width: 'auto',
        maxHeight: '100%',
        maxWidth: '100%',
        ...(isCurrentImage && { willChange: 'transform' })
      }}
      src={src}
      alt={alt}
      draggable="false"
      onDragStart={e => {
        // Disable image ghost dragging in firefox
        e.preventDefault();
      }}
      onClick={e => {
        // Don't close lighbox when clicking image
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
      }}
    />
  );
};

Image.propTypes = {
  /* The source URL of this image */
  src: PropTypes.string.isRequired,
  /* The alt attribute for this image */
  alt: PropTypes.string.isRequired,
  /* True if this image is currently shown in pager, otherwise false */
  isCurrentImage: PropTypes.bool.isRequired,
  /* Function that can be called to disable dragging in the pager */
  setDisableDrag: PropTypes.func.isRequired
};

export default Image;
