import { useState, useEffect } from 'react';

/**
 * React Hook that returns the current window size
 * and report updates from the 'resize' window event
 *
 * @typedef {WindowSize} WindowSize
 * @property {number} width Window width
 * @property {number} height Window height
 * @returns {WindowSize} An object container the window width and height
 */
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    // Add event listener for window resize events
    window.addEventListener('resize', handleResize);

    // Remove event listener
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });

  return windowSize;
};

export default useWindowSize;
