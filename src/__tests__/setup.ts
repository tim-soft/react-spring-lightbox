import '@testing-library/jest-dom/vitest';
import { Globals } from '@react-spring/web';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

Globals.assign({
    // react-spring keeps the requestAnimationFrame it finds at import time,
    // so look it up on every frame to let fake timers drive the frame loop
    requestAnimationFrame: (callback) => requestAnimationFrame(callback),
});

// jsdom has no pointer capture. devices.ts already sends each event to the
// element the gesture started on, so capturing a pointer can do nothing.
if (!('setPointerCapture' in Element.prototype)) {
    Object.assign(Element.prototype, {
        hasPointerCapture: () => false,
        releasePointerCapture: () => {},
        setPointerCapture: () => {},
    });
}

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    // Testing Library only registers its own cleanup when test globals are enabled
    cleanup();
    // Let react-spring's frame loop go idle so it can start again in the next test
    vi.runAllTimers();
    vi.useRealTimers();
});
