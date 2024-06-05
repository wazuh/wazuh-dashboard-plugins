import { renderHook } from '@testing-library/react-hooks';

import { useIsMounted } from './use-is-mounted';

describe('useIsMounted()', () => {
  it('should return true when component is mounted', () => {
    const { result } = renderHook(() => useIsMounted());

    expect(result.current.isComponentMounted()).toBe(true);
  });

  it('should return false when component is unmounted', () => {
    const { result, unmount } = renderHook(() => useIsMounted());

    unmount();

    expect(result.current.isComponentMounted()).toBe(false);
  });
});
