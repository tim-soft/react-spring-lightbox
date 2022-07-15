import React, { useState, useEffect } from 'react';

type IUseRefSize = {
    /** ref height */
    height: number;
    /** ref width */
    width: number;
};

/**
 * React Hook that returns the current ref size
 * and report updates from the 'resize' ref event
 *
 * @returns {RefSize} An object containing the ref width and height
 */
const useRefSize = (refElem: React.RefObject<HTMLDivElement>): IUseRefSize => {
    const [refSize, setRefSize] = useState<IUseRefSize>({
        height: window.innerHeight,
        width: window.innerWidth,
    });

    useEffect(() => {
        const element = refElem.current;
        if (!element) {
            return;
        }
        const handleResize = () => {
            if (
                element.clientHeight !== refSize.height ||
                element.clientWidth !== refSize.width
            ) {
                setRefSize({
                    height: element.clientHeight,
                    width: element.clientWidth,
                });
            }
        };

        // Add event listener for window resize events
        element.addEventListener('resize', handleResize);
        element.addEventListener('orientationchange', handleResize);

        // Remove event listener
        return () => {
            element.removeEventListener('resize', handleResize);
            element.addEventListener('orientationchange', handleResize);
        };
    }, [refElem, refSize.height, refSize.width]);

    return refSize;
};

export default useRefSize;
