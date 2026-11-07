import { act, fireEvent, renderHook } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import useRefSize from '../components/ImageStage/utils/useRefSize';

const elementSized = (size: { height: number; width: number }) => {
    const element = document.createElement('div');
    Object.defineProperties(element, {
        clientHeight: { get: () => size.height },
        clientWidth: { get: () => size.width },
    });
    return element;
};

const renderAttached = (size: { height: number; width: number }) => {
    const hook = renderHook(() => useRefSize());
    act(() => hook.result.current[1](elementSized(size)));
    return hook;
};

describe('useRefSize', () => {
    test('reports a 0x0 size until an element is attached', () => {
        const { result } = renderHook(() => useRefSize());

        fireEvent(window, new Event('resize'));

        expect(result.current[0]).toEqual({ height: 0, width: 0 });
    });

    test('measures the element when the ref attaches', () => {
        const { result } = renderAttached({ height: 300, width: 400 });

        expect(result.current[0]).toEqual({ height: 300, width: 400 });
    });

    test.each(['resize', 'orientationchange'])('re-measures the element on window %s', (eventType) => {
        const size = { height: 300, width: 400 };
        const { result } = renderAttached(size);

        size.height = 500;
        size.width = 700;
        fireEvent(window, new Event(eventType));

        expect(result.current[0]).toEqual({ height: 500, width: 700 });
    });

    test('keeps the same size object when a resize leaves the element size unchanged', () => {
        const { result } = renderAttached({ height: 300, width: 400 });
        const sizeBefore = result.current[0];

        fireEvent(window, new Event('resize'));

        expect(result.current[0]).toBe(sizeBefore);
    });

    test('keeps the last size when the ref detaches', () => {
        const { result } = renderAttached({ height: 300, width: 400 });

        act(() => result.current[1](null));

        expect(result.current[0]).toEqual({ height: 300, width: 400 });
    });
});
