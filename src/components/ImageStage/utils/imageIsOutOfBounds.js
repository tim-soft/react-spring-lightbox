/**
 * Determines if the provided image is within the viewport
 *
 * @param {ref} imageRef The image dom node to measure against the viewport
 *
 * @returns {boolean} True if image needs to be resized to fit viewport, otherwise false
 */
const imageIsOutOfBounds = imageRef => {
  const {
    top: topLeftY,
    left: topLeftX,
    bottom: bottomRightY,
    right: bottomRightX
  } = imageRef.current.getBoundingClientRect();
  const { innerHeight: windowHeight, innerWidth: windowWidth } = window;

  if (
    topLeftX > windowWidth * (1 / 2) ||
    topLeftY > windowHeight * (1 / 2) ||
    bottomRightX < windowWidth * (1 / 2) ||
    bottomRightY < windowHeight * (1 / 2)
  )
    return true;

  return false;
};

export default imageIsOutOfBounds;
