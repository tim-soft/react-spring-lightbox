import { fireEvent, renderHook } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { useDoubleClick } from '../components/ImageStage/utils';
import { advance } from './helpers';

const renderUseDoubleClick = (
    options: Partial<Parameters<typeof useDoubleClick>[0]> = {},
) => {
    const element = document.createElement('div');
    const onDoubleClick = vi.fn();
    const onSingleClick = vi.fn();
    const hook = renderHook(() =>
        useDoubleClick({
            onDoubleClick,
            onSingleClick,
            ref: { current: element },
            ...options,
        }),
    );

    return { element, hook, onDoubleClick, onSingleClick };
};

describe('useDoubleClick', () => {
    test('reports a single click once the default 300ms latency has passed', async () => {
        const { element, onDoubleClick, onSingleClick } =
            renderUseDoubleClick();

        fireEvent.click(element, { clientX: 10 });
        await advance(299);
        expect(onSingleClick).not.toHaveBeenCalled();

        await advance(1);
        expect(onSingleClick).toHaveBeenCalledTimes(1);
        expect(onSingleClick).toHaveBeenCalledWith(
            expect.objectContaining({ clientX: 10, type: 'click' }),
        );
        expect(onDoubleClick).not.toHaveBeenCalled();
    });

    test('reports two clicks within the latency as one double click', async () => {
        const { element, onDoubleClick, onSingleClick } =
            renderUseDoubleClick();

        fireEvent.click(element);
        await advance(100);
        fireEvent.click(element);
        await advance(300);

        expect(onDoubleClick).toHaveBeenCalledTimes(1);
        expect(onSingleClick).not.toHaveBeenCalled();
    });

    test('reports nothing for three clicks within the latency', async () => {
        const { element, onDoubleClick, onSingleClick } =
            renderUseDoubleClick();

        fireEvent.click(element);
        fireEvent.click(element);
        fireEvent.click(element);
        await advance(300);

        expect(onDoubleClick).not.toHaveBeenCalled();
        expect(onSingleClick).not.toHaveBeenCalled();
    });

    test('reports clicks after a custom latency', async () => {
        const { element, onSingleClick } = renderUseDoubleClick({
            latency: 0,
        });

        fireEvent.click(element);
        await advance(0);

        expect(onSingleClick).toHaveBeenCalledTimes(1);
    });

    test('ignores clicks while disabled', async () => {
        const { element, onDoubleClick, onSingleClick } = renderUseDoubleClick({
            enabled: false,
        });

        fireEvent.click(element);
        await advance(300);
        fireEvent.click(element);
        fireEvent.click(element);
        await advance(300);

        expect(onSingleClick).not.toHaveBeenCalled();
        expect(onDoubleClick).not.toHaveBeenCalled();
    });

    test('drops a pending click when unmounted', async () => {
        const { element, hook, onSingleClick } = renderUseDoubleClick();

        fireEvent.click(element);
        hook.unmount();
        await advance(300);

        expect(onSingleClick).not.toHaveBeenCalled();
    });

    test('stops listening for clicks when unmounted', async () => {
        const { element, hook, onSingleClick } = renderUseDoubleClick();

        hook.unmount();
        fireEvent.click(element);
        await advance(300);

        expect(onSingleClick).not.toHaveBeenCalled();
    });

    test('works without callbacks or a mounted element', async () => {
        const element = document.createElement('div');
        renderHook(() => useDoubleClick({ ref: { current: element } }));
        const { unmount } = renderHook(() =>
            useDoubleClick({ ref: { current: null } }),
        );

        fireEvent.click(element);
        fireEvent.click(element);
        await advance(300);
        fireEvent.click(element);
        await advance(300);

        expect(unmount).not.toThrow();
    });
});
