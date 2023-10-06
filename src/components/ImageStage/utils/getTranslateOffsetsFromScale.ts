type IGetTranslateOffsetsFromScale = {
    /** The current [x,y] translate values of image */
    currentTranslate: [translateX: number, translateY: number];
    /** The image dom node used as a reference to calculate translate offsets */
    imageRef: React.RefObject<HTMLImageElement>;
    /** The amount of change in the new transform scale */
    pinchDelta: number;
    /** The current transform scale of image */
    scale: number;
    /** The [x,y] coordinates of the zoom origin */
    touchOrigin: [touchOriginX: number, touchOriginY: number];
};

type ITranslateOffsetsReturnType = [translateX: number, translateY: number];

/**
 * Calculates the the translate(x,y) coordinates needed to zoom-in
 * to a point in an image.
 *
 * @returns {array} The next [x,y] translate values to apply to image
 */
const getTranslateOffsetsFromScale = ({
    currentTranslate: [translateX, translateY],
    imageRef,
    pinchDelta,
    scale,
    touchOrigin: [touchOriginX, touchOriginY],
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
