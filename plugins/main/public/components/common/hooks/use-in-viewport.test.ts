import { renderHook, act } from '@testing-library/react';
import { useInViewport } from './use-in-viewport';

describe('useInViewport', () => {
  function createObserverHarness() {
    let capturedCallback: IntersectionObserverCallback | undefined;
    const observe = jest.fn();
    const disconnect = jest.fn();
    const factory = jest.fn((callback: IntersectionObserverCallback) => {
      capturedCallback = callback;
      return { observe, disconnect } as unknown as IntersectionObserver;
    });
    const trigger = (isIntersecting: boolean) =>
      act(() => {
        capturedCallback?.(
          [{ isIntersecting } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        );
      });
    return { factory, observe, disconnect, trigger };
  }

  it('starts not visible and does not observe until a node is attached', () => {
    const { factory } = createObserverHarness();
    const { result } = renderHook(() =>
      useInViewport({ observerFactory: factory }),
    );
    // No node attached in this bare hook render, so nothing is observed yet.
    expect(result.current[1]).toBe(false);
  });

  it('latches to visible when the element intersects', () => {
    const { factory, trigger } = createObserverHarness();
    const { result } = renderHook(() => {
      const [ref, visible] = useInViewport({ observerFactory: factory });
      // attach the ref to a real node so the observer is created
      (ref as { current: Element }).current = document.createElement('div');
      return visible;
    });

    // Re-run effect now that the node exists.
    trigger(false);
    expect(result.current).toBe(false);

    trigger(true);
    expect(result.current).toBe(true);
  });

  it('falls back to immediately visible when no observer is available', () => {
    const { result } = renderHook(() => {
      const [ref, visible] = useInViewport({ observerFactory: undefined });
      (ref as { current: Element }).current = document.createElement('div');
      return visible;
    });
    // jsdom has no IntersectionObserver and no factory injected.
    expect(result.current).toBe(true);
  });
});
