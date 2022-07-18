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
            const { height, width } = element.getBoundingClientRect();
            if (height !== refSize.height || width !== refSize.width) {
                setRefSize({
                    height,
                    width,
                });
            }
        };

        // Add event listener for window resize events
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        // Remove event listener
        return () => {
            window.removeEventListener('resize', handleResize);
            window.addEventListener('orientationchange', handleResize);
        };
    }, [refElem, refSize.height, refSize.width]);

    return refSize;
};

export default useRefSize;
