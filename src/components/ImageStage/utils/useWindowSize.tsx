import { useState, useEffect } from 'react';

type IUseWindowSize = {
    /** window height */
    height: number;
    /** window width */
    width: number;
};

/**
 * React Hook that returns the current window size
 * and report updates from the 'resize' window event
 *
 * @returns {WindowSize} An object containing the window width and height
 */
const useWindowSize = (): IUseWindowSize => {
    const [windowSize, setWindowSize] = useState<IUseWindowSize>({
        height: window.innerHeight,
        width: window.innerWidth,
    });

    useEffect(() => {
        const handleResize = () => {
            if (
                window.innerHeight !== windowSize.height ||
                window.innerWidth !== windowSize.width
            ) {
                setWindowSize({
                    height: window.innerHeight,
                    width: window.innerWidth,
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
    });

    return windowSize;
};

export default useWindowSize;
