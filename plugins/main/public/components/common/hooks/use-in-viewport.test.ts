import { renderHook, act } from '@testing-library/react';
import { useInViewport } from './use-in-viewport';

describe('useInViewport', () => {
  const originalIntersectionObserver = window.IntersectionObserver;

  let capturedCallback: IntersectionObserverCallback | undefined;
  const observe = jest.fn();
  const disconnect = jest.fn();

  /** Install a fake window.IntersectionObserver that captures its callback. */
  function installObserver() {
    capturedCallback = undefined;
    observe.mockClear();
    disconnect.mockClear();
    (
      window as unknown as {
        IntersectionObserver: unknown;
      }
    ).IntersectionObserver = jest.fn(function (
      this: IntersectionObserver,
      callback: IntersectionObserverCallback,
    ) {
      capturedCallback = callback;
      this.observe = observe;
      this.disconnect = disconnect;
    });
  }

  const trigger = (isIntersecting: boolean) =>
    act(() => {
      capturedCallback?.(
        [{ isIntersecting } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

  afterEach(() => {
    window.IntersectionObserver = originalIntersectionObserver;
  });

  it('starts not visible and does not observe until a node is attached', () => {
    installObserver();
    const { result } = renderHook(() => useInViewport());
    // No node attached in this bare hook render, so nothing is observed yet.
    expect(result.current[1]).toBe(false);
    expect(observe).not.toHaveBeenCalled();
  });

  it('latches to visible when the element intersects', () => {
    installObserver();
    const { result } = renderHook(() => {
      const [ref, visible] = useInViewport();
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
    // jsdom has no IntersectionObserver; ensure none is installed.
    delete (window as unknown as { IntersectionObserver?: unknown })
      .IntersectionObserver;
    const { result } = renderHook(() => {
      const [ref, visible] = useInViewport();
      (ref as { current: Element }).current = document.createElement('div');
      return visible;
    });
    expect(result.current).toBe(true);
  });
});
