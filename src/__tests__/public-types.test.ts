import type { ComponentProps, ReactNode } from 'react';
import { expectTypeOf, test } from 'vitest';
import type Lightbox from '../index';
import type { ImagesListType } from '../index';

// TypeScript users rely on these types. tsc checks them in `yarn lint:ts`,
// and the runtime part of each test does nothing.

type Props = ComponentProps<typeof Lightbox>;
type Image = ImagesListType[number];

test('an image needs alt and src, and takes any other img attribute', () => {
    expectTypeOf<{
        alt: string;
        'aria-describedby': string;
        loading: 'lazy';
        src: string;
        srcSet: string;
        style: { borderRadius: string };
    }>().toExtend<Image>();

    expectTypeOf<{ src: string }>().not.toExtend<Image>();
    expectTypeOf<{ alt: string }>().not.toExtend<Image>();
});

test('the lightbox owns an image’s click, drag and ref', () => {
    expectTypeOf<Image>().not.toHaveProperty('onClick');
    expectTypeOf<Image>().not.toHaveProperty('onDragStart');
    expectTypeOf<Image>().not.toHaveProperty('draggable');
    expectTypeOf<Image>().not.toHaveProperty('ref');
});

test('currentIndex, images, isOpen, onNext and onPrev are required', () => {
    const required = {
        currentIndex: 0,
        images: [] as ImagesListType,
        isOpen: true,
        onNext: () => undefined,
        onPrev: () => undefined,
    };
    expectTypeOf(required).toExtend<Props>();

    const { onNext, ...withoutOnNext } = required;
    expectTypeOf(onNext).toBeFunction();
    expectTypeOf(withoutOnNext).not.toExtend<Props>();
});

test('every other prop is optional', () => {
    expectTypeOf<Props['onClose']>().toEqualTypeOf<(() => void) | undefined>();
    expectTypeOf<Props['inline']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<Props['singleClickToZoom']>().toEqualTypeOf<
        boolean | undefined
    >();
    expectTypeOf<Props['className']>().toEqualTypeOf<string | undefined>();
});

test('the arrow buttons learn whether there is a previous or next image', () => {
    expectTypeOf<NonNullable<Props['renderNextButton']>>().toEqualTypeOf<
        ({ canNext }: { canNext: boolean }) => ReactNode
    >();
    expectTypeOf<NonNullable<Props['renderPrevButton']>>().toEqualTypeOf<
        ({ canPrev }: { canPrev: boolean }) => ReactNode
    >();
});
