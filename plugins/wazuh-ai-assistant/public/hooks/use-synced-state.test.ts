import { act, renderHook } from '@testing-library/react';
import { useSyncedState } from './use-synced-state';

describe('useSyncedState', () => {
  it('returns the initial value as both the state and the ref', () => {
    const { result } = renderHook(() => useSyncedState('start'));

    expect(result.current[0]).toBe('start');
    expect(result.current[2].current).toBe('start');
  });

  it('a plain value update updates both the state and the ref', () => {
    const { result } = renderHook(() => useSyncedState('start'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(result.current[2].current).toBe('updated');
  });

  it('an updater-function update computes from the current value', () => {
    const { result } = renderHook(() => useSyncedState(1));

    act(() => {
      result.current[1](previous => previous + 1);
    });

    expect(result.current[0]).toBe(2);
    expect(result.current[2].current).toBe(2);
  });

  it('writes the ref synchronously as part of the setter call itself, not waiting for a re-render to commit', () => {
    const { result } = renderHook(() => useSyncedState('start'));
    const ref = result.current[2];

    act(() => {
      result.current[1]('updated');
      // Asserted INSIDE the same act() callback, before this call has flushed the pending
      // re-render: the ref must already carry the new value the moment the setter is invoked —
      // this is the whole reason this hook exists (see its own doc comment: a `for await` stream
      // loop or a promise `.then` reading `ref.current` right after calling the setter, not from
      // inside a React event handler, and not waiting on a fresh render).
      expect(ref.current).toBe('updated');
    });
  });

  it('the ref reflects the latest value from inside an async callback that is not a React event handler', async () => {
    const { result } = renderHook(() => useSyncedState(0));

    await act(async () => {
      await Promise.resolve().then(() => {
        result.current[1](42);
        expect(result.current[2].current).toBe(42);
      });
    });

    expect(result.current[0]).toBe(42);
  });

  it('keeps the ref in sync across several updater calls batched into one render', () => {
    const { result } = renderHook(() => useSyncedState<string[]>([]));
    const ref = result.current[2];

    act(() => {
      // Two updater calls with no render in between — the shape React 18's automatic batching
      // produces for `runChatStream`'s rAF-batched delta flushes. Writing the ref from inside the
      // `setValue` updater lost the SECOND value here: React 18 only evaluates an updater eagerly
      // while the fiber has no pending lanes, so once the first call queued an update the second
      // updater (and its ref write) was deferred to render time.
      result.current[1](current => [...current, 'first']);
      result.current[1](current => [...current, 'second']);
      expect(ref.current).toEqual(['first', 'second']);
    });

    expect(result.current[0]).toEqual(['first', 'second']);
    expect(ref.current).toEqual(['first', 'second']);
  });

  it('applies a plain-value update batched after an updater update', () => {
    const { result } = renderHook(() => useSyncedState('start'));
    const ref = result.current[2];

    act(() => {
      result.current[1](current => `${current}-a`);
      result.current[1]('replaced');
      expect(ref.current).toBe('replaced');
    });

    expect(result.current[0]).toBe('replaced');
  });

  it('returns the same ref object across re-renders (never recreated)', () => {
    const { result, rerender } = renderHook(() => useSyncedState('a'));
    const firstRef = result.current[2];

    act(() => {
      result.current[1]('b');
    });
    rerender();

    expect(result.current[2]).toBe(firstRef);
  });

  it('accepts a fresh initial value type parameter (object identity preserved when unchanged)', () => {
    const initial = { count: 0 };
    const { result } = renderHook(() => useSyncedState(initial));

    expect(result.current[0]).toBe(initial);
    expect(result.current[2].current).toBe(initial);

    const next = { count: 1 };
    act(() => {
      result.current[1](next);
    });

    expect(result.current[0]).toBe(next);
    expect(result.current[2].current).toBe(next);
  });
});
