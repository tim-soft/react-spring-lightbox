type IGetTranslateOffsetsFromScale = {
    currentTranslate: [translateX: number, translateY: number];
    imageRef: React.RefObject<HTMLImageElement>;
    pinchDelta: number;
    scale: number;
    touchOrigin: [touchOriginX: number, touchOriginY: number];
};

type ITranslateOffsetsReturnType = [translateX: number, translateY: number];

/**
 * Calculates the the translate(x,y) coordinates needed to zoom-in
 * to a point in an image.
 *
 * @param {ref} imageRef The image dom node used as a reference to calculate translate offsets
 * @param {number} scale The current transform scale of image
 * @param {number} pinchDelta The amount of change in the new transform scale
 * @param {array} touchOrigin The [x,y] coordinates of the zoom origin
 * @param {array} currentTranslate The current [x,y] translate values of image
 *
 * @returns {array} The next [x,y] translate values to apply to image
 */
const getTranslateOffsetsFromScale = ({
    imageRef,
    scale,
    pinchDelta,
    touchOrigin: [touchOriginX, touchOriginY],
    currentTranslate: [translateX, translateY],
}: IGetTranslateOffsetsFromScale): ITranslateOffsetsReturnType => {
    if (!imageRef?.current) {
        return [0, 0];
    }

    const {
        height: imageHeight,
        left: imageTopLeftX,
        top: imageTopLeftY,
        width: imageWidth,
    } = imageRef.current?.getBoundingClientRect();

    // Get the (x,y) touch position relative to image origin at the current scale
    const imageCoordX = (touchOriginX - imageTopLeftX - imageWidth / 2) / scale;
    const imageCoordY =
        (touchOriginY - imageTopLeftY - imageHeight / 2) / scale;

    // Calculate translateX/Y offset at the next scale to zoom to touch position
    const newTranslateX = -imageCoordX * pinchDelta + translateX;
    const newTranslateY = -imageCoordY * pinchDelta + translateY;

    return [newTranslateX, newTranslateY];
};

export default getTranslateOffsetsFromScale;
