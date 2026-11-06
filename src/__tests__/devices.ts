import { fireEvent } from '@testing-library/react';
import { onTestFinished, vi } from 'vitest';
import { FRAME, advance } from './helpers';
import type { Point } from './helpers';

// Each device sends the DOM events a browser sends for it, in the same order.
// Every event goes to the element the gesture started on, as pointer capture does.

type PointerType = 'mouse' | 'pen' | 'touch';

const firePointer = (
    type: 'pointerDown' | 'pointerMove' | 'pointerUp',
    target: Element,
    [clientX, clientY]: Point,
    { id, pointerType }: { id: number; pointerType: PointerType },
) =>
    fireEvent[type](target, {
        buttons: type === 'pointerUp' ? 0 : 1,
        clientX,
        clientY,
        isPrimary: id === 1,
        pointerId: id,
        pointerType,
    });

const fireClick = (target: Element, [clientX, clientY]: Point) =>
    fireEvent.click(target, { clientX, clientY });

/** Holds a mouse button or pen down on `target` until `release` */
export const pressPointer = (
    target: Element,
    start: Point,
    pointer: { id: number; pointerType: PointerType },
) => {
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
    click(target: Element, point: Point) {
        pressMouse(target, point).release();
    },
    async doubleClick(target: Element, point: Point) {
        mouse.click(target, point);
        await advance(100);
        mouse.click(target, point);
    },
    /** Presses at the first point, moves through the rest `msPerMove` apart, then releases */
    async drag(target: Element, [start, ...moves]: Point[], msPerMove = FRAME) {
        const button = pressMouse(target, start);
        for (const point of moves) {
            await button.moveTo(point, msPerMove);
        }
        button.release();
    },
};

/** Fires one wheel event, as a mouse wheel or trackpad does */
export const wheel = (
    target: Element,
    {
        at: [clientX, clientY] = [512, 384],
        ctrlKey = false,
        deltaX = 0,
        deltaY = 0,
    }: { at?: Point; ctrlKey?: boolean; deltaX?: number; deltaY?: number },
) => fireEvent.wheel(target, { clientX, clientY, ctrlKey, deltaX, deltaY });

export const trackpad = {
    /** A pinch in Chrome, Edge and Firefox, which send it as ctrl + wheel. Negative deltaY zooms in. */
    async pinch(
        target: Element,
        {
            at,
            deltaY,
            ticks = 1,
        }: { at?: Point; deltaY: number; ticks?: number },
    ) {
        for (let tick = 0; tick < ticks; tick += 1) {
            wheel(target, { at, ctrlKey: true, deltaY: deltaY / ticks });
            await advance(FRAME);
        }
    },
    /** A two-finger scroll: one wheel event per frame */
    async scroll(
        target: Element,
        { deltaX = 0, deltaY = 0, ticks = 5 }: Record<string, number>,
    ) {
        for (let tick = 0; tick < ticks; tick += 1) {
            wheel(target, { deltaX: deltaX / ticks, deltaY: deltaY / ticks });
            await advance(FRAME);
        }
    },
};

type Finger = { id: number; point: Point };

/**
 * Puts fingers on a touchscreen, one after another, until `lift`. Pass
 * `pointerEvents: false` to send only touch events.
 */
export const touch = (
    target: Element,
    points: Point[],
    { pointerEvents = true } = {},
) => {
    const pointer = (...args: Parameters<typeof firePointer>) =>
        pointerEvents && firePointer(...args);
    const fingers: Finger[] = [];
    const toTouch = ({ id, point: [clientX, clientY] }: Finger) => ({
        clientX,
        clientY,
        identifier: id,
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
    async doubleTap(target: Element, point: Point) {
        touchscreen.tap(target, point);
        await advance(100);
        touchscreen.tap(target, point);
    },
    /** Two fingers moving from `from` to `to` over `steps` frames, then lifting */
    async pinch(
        target: Element,
        from: [Point, Point],
        to: [Point, Point],
        { pointerEvents = true, steps = 3 } = {},
    ) {
        const fingers = touch(target, from, { pointerEvents });
        for (let step = 1; step <= steps; step += 1) {
            const between = (a: Point, b: Point): Point => [
                a[0] + ((b[0] - a[0]) * step) / steps,
                a[1] + ((b[1] - a[1]) * step) / steps,
            ];
            await fingers.moveTo([
                between(from[0], to[0]),
                between(from[1], to[1]),
            ]);
        }
        fingers.lift();
    },
    /** One finger from the first point through the rest, `msPerMove` apart */
    async swipe(
        target: Element,
        [start, ...moves]: Point[],
        msPerMove = FRAME,
    ) {
        const finger = touch(target, [start]);
        for (const point of moves) {
            await finger.moveTo([point], msPerMove);
        }
        finger.lift();
    },
    tap(target: Element, point: Point) {
        touch(target, [point]).lift();
    },
};

/** Hides a window event handler property, the way browsers without that event lack it */
const removeForTest = (handler: 'ontouchstart') => {
    let owner: object = window;
    while (!Object.prototype.hasOwnProperty.call(owner, handler)) {
        owner = Object.getPrototypeOf(owner);
    }
    const descriptor = Object.getOwnPropertyDescriptor(
        owner,
        handler,
    ) as PropertyDescriptor;
    delete (owner as Record<string, unknown>)[handler];

    onTestFinished(() => {
        Object.defineProperty(owner, handler, descriptor);
    });
};

/**
 * Desktop Safari: pointer events but no touch events, and trackpad pinches
 * arrive as WebKit gesture events. Call before rendering.
 */
export const emulateDesktopSafari = () => {
    removeForTest('ontouchstart');
    vi.stubGlobal('GestureEvent', class GestureEvent extends UIEvent {});
    onTestFinished(() => {
        vi.unstubAllGlobals();
    });
};

/** A trackpad pinch on desktop Safari, through each scale in `scales` */
export const safariPinch = async (
    target: Element,
    { at: [clientX, clientY], scales }: { at: Point; scales: number[] },
) => {
    const gesture = (type: string, scale: number) =>
        fireEvent(
            target,
            Object.assign(
                new Event(type, { bubbles: true, cancelable: true }),
                {
                    clientX,
                    clientY,
                    rotation: 0,
                    scale,
                },
            ),
        );

    gesture('gesturestart', 1);
    for (const scale of scales) {
        await advance(FRAME);
        gesture('gesturechange', scale);
    }
    gesture('gestureend', scales[scales.length - 1]);
};

/** Presses and releases `key`. Returns false when the lightbox blocked the key's default action, such as scrolling. */
export const pressKey = (
    key: string,
    target: Element | Document = document,
) => {
    const allowed = fireEvent.keyDown(target, { key });
    fireEvent.keyUp(target, { key });
    return allowed;
};
