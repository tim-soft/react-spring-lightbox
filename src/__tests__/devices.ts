import { fireEvent } from '@testing-library/react';

import type { Point } from './helpers';

import { FRAME, advance } from './helpers';

// Each device sends the DOM events a browser sends for it, in the same order.
// Every event goes to the element the gesture started on, as pointer capture does.

type PointerType = 'mouse' | 'pen' | 'touch';

const firePointer = (
    type: 'pointerDown' | 'pointerMove' | 'pointerUp',
    target: Element,
    [clientX, clientY]: Point,
    { id, pointerType }: { id: number; pointerType: PointerType }
) =>
    fireEvent[type](target, {
        buttons: type === 'pointerUp' ? 0 : 1,
        clientX,
        clientY,
        isPrimary: id === 1,
        pointerId: id,
        pointerType,
    });

// A browser's click counts the clicks in `detail`, which a keyboard click leaves at 0
const fireClick = (target: Element, [clientX, clientY]: Point) =>
    fireEvent.click(target, { clientX, clientY, detail: 1 });

/** Holds a mouse button or pen down on `target` until `release` */
export const pressPointer = (target: Element, start: Point, pointer: { id: number; pointerType: PointerType }) => {
    let position = start;

    firePointer('pointerDown', target, start, pointer);

    return {
        /** Moves the mouse `ms` after the previous event */
        async moveTo(point: Point, ms = FRAME) {
            await advance(ms);
            position = point;
            firePointer('pointerMove', target, point, pointer);
        },
        /** Releases the button. Browsers then click, even at the end of a drag. */
        release() {
            firePointer('pointerUp', target, position, pointer);
            fireClick(target, position);
        },
    };
};

export const pressMouse = (target: Element, start: Point) =>
    pressPointer(target, start, { id: 1, pointerType: 'mouse' });

export const mouse = {
    click: (target: Element, point: Point) => {
        pressMouse(target, point).release();
    },
    doubleClick: async (target: Element, point: Point) => {
        mouse.click(target, point);
        await advance(100);
        mouse.click(target, point);
    },
    /** Presses at the first point, moves through the rest `msPerMove` apart, then releases */
    drag: async (target: Element, [start, ...moves]: Point[], msPerMove = FRAME) => {
        const button = pressMouse(target, start);
        for (const point of moves) {
            await button.moveTo(point, msPerMove);
        }
        button.release();
    },
};

/** Fires one wheel event, as a mouse wheel or trackpad does. A deltaMode of 1 counts lines, and 2 pages. */
export const wheel = (
    target: Element,
    {
        at: [clientX, clientY] = [512, 384],
        ctrlKey = false,
        deltaMode = 0,
        deltaX = 0,
        deltaY = 0,
    }: { at?: Point; ctrlKey?: boolean; deltaMode?: number; deltaX?: number; deltaY?: number }
) => fireEvent.wheel(target, { clientX, clientY, ctrlKey, deltaMode, deltaX, deltaY });

export const trackpad = {
    /** A pinch in Chrome, Edge and Firefox, which send it as ctrl + wheel. Negative deltaY zooms in. */
    pinch: async (target: Element, { at, deltaY, ticks = 1 }: { at?: Point; deltaY: number; ticks?: number }) => {
        for (let tick = 0; tick < ticks; tick += 1) {
            wheel(target, { at, ctrlKey: true, deltaY: deltaY / ticks });
            await advance(FRAME);
        }
    },
    /** A two-finger scroll: one wheel event per frame */
    scroll: async (target: Element, { deltaX = 0, deltaY = 0, ticks = 5 }: Record<string, number>) => {
        for (let tick = 0; tick < ticks; tick += 1) {
            wheel(target, { deltaX: deltaX / ticks, deltaY: deltaY / ticks });
            await advance(FRAME);
        }
    },
    swipe: async (target: Element, deltasX: number[]) => {
        for (const deltaX of deltasX) {
            wheel(target, { deltaX });
            await advance(FRAME);
        }
    },
};

type Finger = { id: number; point: Point };

/**
 * Puts fingers on a touchscreen, one after another, until `lift`. Pass
 * `pointerEvents: false` to send only touch events.
 */
export const touch = (target: Element, points: Point[], { pointerEvents = true } = {}) => {
    const pointer = (...args: Parameters<typeof firePointer>) => pointerEvents && firePointer(...args);
    const fingers: Finger[] = [];
    const toTouch = ({ id, point: [clientX, clientY] }: Finger) => ({
        clientX,
        clientY,
        identifier: id,
        target,
    });
    const touchLists = (changed: Finger[]) => {
        const touches = fingers.map(toTouch);
        return {
            changedTouches: changed.map(toTouch),
            targetTouches: touches,
            touches,
        };
    };
    const putDown = (point: Point) => {
        const finger = { id: fingers.length + 1, point };
        fingers.push(finger);
        pointer('pointerDown', target, point, {
            id: finger.id,
            pointerType: 'touch',
        });
        fireEvent.touchStart(target, touchLists([finger]));
    };
    let moved = false;

    points.forEach(putDown);

    return {
        /** Puts another finger down */
        add(point: Point) {
            putDown(point);
        },
        /** Lifts the fingers in the order they went down. A one-finger touch that never moved is a tap, so the browser clicks. */
        lift() {
            const [first] = fingers;
            const tapped = fingers.length === 1 && !moved;
            while (fingers.length > 0) {
                const finger = fingers.shift() as Finger;
                pointer('pointerUp', target, finger.point, {
                    id: finger.id,
                    pointerType: 'touch',
                });
                fireEvent.touchEnd(target, touchLists([finger]));
            }
            if (tapped) {
                fireClick(target, first.point);
            }
        },
        /** Moves every finger, in order, `ms` after the previous event */
        async moveTo(next: Point[], ms = FRAME) {
            await advance(ms);
            moved = true;
            fingers.forEach((finger, index) => {
                finger.point = next[index];
                pointer('pointerMove', target, finger.point, {
                    id: finger.id,
                    pointerType: 'touch',
                });
            });
            fireEvent.touchMove(target, touchLists(fingers));
        },
    };
};

export const touchscreen = {
    doubleTap: async (target: Element, point: Point) => {
        touchscreen.tap(target, point);
        await advance(100);
        touchscreen.tap(target, point);
    },
    /** Two fingers moving from `from` to `to` over `steps` frames, then lifting */
    pinch: async (
        target: Element,
        from: [Point, Point],
        to: [Point, Point],
        { pointerEvents = true, steps = 3 } = {}
    ) => {
        const fingers = touch(target, from, { pointerEvents });
        for (let step = 1; step <= steps; step += 1) {
            const between = (a: Point, b: Point): Point => [
                a[0] + ((b[0] - a[0]) * step) / steps,
                a[1] + ((b[1] - a[1]) * step) / steps,
            ];
            await fingers.moveTo([between(from[0], to[0]), between(from[1], to[1])]);
        }
        fingers.lift();
    },
    /** One finger from the first point through the rest, `msPerMove` apart */
    swipe: async (target: Element, [start, ...moves]: Point[], msPerMove = FRAME) => {
        const finger = touch(target, [start]);
        for (const point of moves) {
            await finger.moveTo([point], msPerMove);
        }
        finger.lift();
    },
    tap: (target: Element, point: Point) => {
        touch(target, [point]).lift();
    },
};

/** One WebKit gesture event, as desktop Safari sends for a trackpad pinch. See desktop-safari.test.tsx. */
export const safariGesture = (
    target: Element,
    type: 'gesturechange' | 'gestureend' | 'gesturestart',
    [clientX, clientY]: Point,
    scale: number
) =>
    fireEvent(
        target,
        Object.assign(new Event(type, { bubbles: true, cancelable: true }), {
            clientX,
            clientY,
            rotation: 0,
            scale,
        })
    );

/** A trackpad pinch on desktop Safari, through each scale in `scales` */
export const safariPinch = async (target: Element, { at, scales }: { at: Point; scales: number[] }) => {
    safariGesture(target, 'gesturestart', at, 1);
    for (const scale of scales) {
        await advance(FRAME);
        safariGesture(target, 'gesturechange', at, scale);
    }
    safariGesture(target, 'gestureend', at, scales[scales.length - 1]);
};

/** Presses and releases `key`. Returns false when the lightbox blocked the key's default action, such as scrolling. */
export const pressKey = (key: string, target: Element | Document = document) => {
    const allowed = fireEvent.keyDown(target, { key });
    fireEvent.keyUp(target, { key });
    return allowed;
};
