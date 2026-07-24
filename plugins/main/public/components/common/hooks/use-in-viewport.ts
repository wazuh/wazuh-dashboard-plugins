import { useEffect, useRef, useState, RefObject } from 'react';

/**
 * Observe whether an element has entered the viewport. Returns a ref to attach
 * and a `hasBeenVisible` flag that latches to `true` the first time the element
 * intersects — so a group fetches once when scrolled into view and does not
 * re-fetch when it scrolls out and back in.
 *
 * When no IntersectionObserver is available (e.g. jsdom), it degrades to
 * immediately visible so content is never hidden by a missing browser API.
 */
export function useInViewport<T extends Element = HTMLDivElement>(
  options: IntersectionObserverInit = {},
): [RefObject<T>, boolean] {
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

    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      // No IntersectionObserver support: treat as visible rather than hide.
      setHasBeenVisible(true);
      return;
    }

    const observer = new window.IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setHasBeenVisible(true);
      }
    }, options);

    observer.observe(node);
    return () => observer.disconnect();
    // options is a stable object supplied by the caller.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasBeenVisible]);

  return [ref, hasBeenVisible];
}
