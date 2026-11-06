import { describe, expect, test } from 'vitest';
import {
    getTranslateOffsetsFromScale,
    imageIsOutOfBounds,
} from '../components/ImageStage/utils';
import { toDOMRect } from './helpers';

const imageRefAt = (box: Parameters<typeof toDOMRect>[0]) => {
    const image = document.createElement('img');
    image.getBoundingClientRect = () => toDOMRect(box);
    return { current: image };
};

const noImageRef = { current: null };

describe('getTranslateOffsetsFromScale', () => {
    // An untransformed 400x300 image centered at (300, 200)
    const center: [number, number] = [300, 200];
    const size = { height: 300, width: 400 };

    /** Screen position of a point given as an offset from the image center at scale 1 */
    const onScreen = (
        [offsetX, offsetY]: [number, number],
        scale: number,
        [translateX, translateY]: [number, number],
    ): [number, number] => [
        center[0] + translateX + offsetX * scale,
        center[1] + translateY + offsetY * scale,
    ];

    /** The image's bounding box after applying `scale` and `translate` */
    const imageRefWith = (
        scale: number,
        [translateX, translateY]: [number, number],
    ) =>
        imageRefAt({
            height: size.height * scale,
            left: center[0] + translateX - (size.width * scale) / 2,
            top: center[1] + translateY - (size.height * scale) / 2,
            width: size.width * scale,
        });

    test('returns no offset before the image is mounted', () => {
        expect(
            getTranslateOffsetsFromScale({
                currentTranslate: [10, 20],
                imageRef: noImageRef,
                pinchDelta: 1,
                scale: 1,
                touchOrigin: [400, 250],
            }),
        ).toEqual([0, 0]);
    });

    test.each<{ from: number; to: number; translate: [number, number] }>([
        { from: 1, to: 2, translate: [0, 0] },
        { from: 2, to: 2.5, translate: [-100, -50] },
        { from: 2, to: 1.5, translate: [40, -30] },
    ])(
        'keeps the touched point under the finger when zooming from $from to $to',
        ({ from, to, translate }) => {
            const touchedPoint: [number, number] = [100, 50];
            const touchOrigin = onScreen(touchedPoint, from, translate);

            const nextTranslate = getTranslateOffsetsFromScale({
                currentTranslate: translate,
                imageRef: imageRefWith(from, translate),
                pinchDelta: to - from,
                scale: from,
                touchOrigin,
            });

            const [x, y] = onScreen(touchedPoint, to, nextTranslate);
            expect(x).toBeCloseTo(touchOrigin[0]);
            expect(y).toBeCloseTo(touchOrigin[1]);
        },
    );
});

describe('imageIsOutOfBounds', () => {
    // jsdom's window is 1024x768, so its center is (512, 384)
    test('is false before the image is mounted', () => {
        expect(imageIsOutOfBounds(noImageRef)).toBe(false);
    });

    test('is false while the image covers the center of the window', () => {
        expect(
            imageIsOutOfBounds(
                imageRefAt({ height: 400, left: 212, top: 184, width: 600 }),
            ),
        ).toBe(false);
    });

    test.each([
        [
            'left edge is right of',
            { height: 400, left: 600, top: 184, width: 600 },
        ],
        ['top edge is below', { height: 400, left: 212, top: 400, width: 600 }],
        [
            'right edge is left of',
            { height: 400, left: 0, top: 184, width: 500 },
        ],
        [
            'bottom edge is above',
            { height: 300, left: 212, top: 0, width: 600 },
        ],
    ])('is true when the image %s the center of the window', (_, box) => {
        expect(imageIsOutOfBounds(imageRefAt(box))).toBe(true);
    });
});
