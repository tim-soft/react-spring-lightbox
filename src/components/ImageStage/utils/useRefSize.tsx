import { useCallback, useEffect, useRef, useState } from 'react';

type RefSize = {
    height: number;
    width: number;
};

type Node = HTMLDivElement | null;

type IUseRefSize = [refSize: RefSize, elementRef: (node: any) => void | null];

/**
 * React Hook that returns the current ref size
 * and report updates from the 'resize' ref event
 *
 * @returns {RefSize} An object containing the ref width and height
 * @returns {elementRef} A callback ref to be used on the container being measured
 */
const useRefSize = (): IUseRefSize => {
    const ref = useRef<HTMLDivElement>(null);

    const [node, setNode] = useState<Node>(null);
    const [refSize, setRefSize] = useState<RefSize>({
        height: ref.current?.clientHeight || 0,
        width: ref.current?.clientWidth || 0,
    });

    const elementRef = useCallback((node) => {
        if (node !== null) {
            setNode(node);
        }
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (node) {
                const height = node.clientHeight;
                const width = node.clientWidth;
                if (height !== refSize.height || width !== refSize.width) {
                    setRefSize({
                        height,
                        width,
                    });
                }
            }
        };
        if (node) {
            setRefSize({
                height: node.clientHeight,
                width: node.clientWidth,
            });
        }
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, [node, refSize.height, refSize.width]);

    return [refSize, elementRef];
};

export default useRefSize;
