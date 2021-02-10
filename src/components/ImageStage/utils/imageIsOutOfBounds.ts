/**
 * Determines if the provided image is within the viewport
 *
 * @returns True if image needs to be resized to fit viewport, otherwise false
 */
const imageIsOutOfBounds = (
    imageRef: React.RefObject<HTMLImageElement>
): boolean => {
    // If no ref is provided, return false
    if (!imageRef.current) {
        return false;
    }

    const {
        bottom: bottomRightY,
        left: topLeftX,
        right: bottomRightX,
        top: topLeftY,
    } = imageRef.current?.getBoundingClientRect();
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
