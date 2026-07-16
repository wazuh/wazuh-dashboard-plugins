import { useEffect, useRef, useState, RefObject } from 'react';

type ObserverFactory = (
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit,
) => IntersectionObserver;

export interface UseInViewportOptions extends IntersectionObserverInit {
  /**
   * Injectable IntersectionObserver factory. Defaults to
   * `window.IntersectionObserver`. Exposed so tests can drive visibility
   * deterministically (jsdom has no IntersectionObserver).
   */
  observerFactory?: ObserverFactory;
}

/**
 * Observe whether an element has entered the viewport. Returns a ref to attach
 * and a `hasBeenVisible` flag that latches to `true` the first time the element
 * intersects — so a group fetches once when scrolled into view and does not
 * re-fetch when it scrolls out and back in.
 *
 * When no IntersectionObserver is available (e.g. jsdom without an injected
 * factory), it degrades to immediately visible so content is never hidden by a
 * missing browser API.
 */
export function useInViewport<T extends Element = HTMLDivElement>(
  options: UseInViewportOptions = {},
): [RefObject<T>, boolean] {
  const { observerFactory, ...observerInit } = options;
  const ref = useRef<T>(null);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    if (hasBeenVisible) {
      return;
    }
    const node = ref.current;
    if (!node) {
      return;
    }

    const factory: ObserverFactory | undefined =
      observerFactory ||
      (typeof window !== 'undefined' && window.IntersectionObserver
        ? (callback, init) => new window.IntersectionObserver(callback, init)
        : undefined);

    if (!factory) {
      // No IntersectionObserver support: treat as visible rather than hide.
      setHasBeenVisible(true);
      return;
    }

    const observer = factory(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setHasBeenVisible(true);
      }
    }, observerInit);

    observer.observe(node);
    return () => observer.disconnect();
    // observerInit is spread from options; callers pass a stable object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasBeenVisible, observerFactory]);

  return [ref, hasBeenVisible];
}
