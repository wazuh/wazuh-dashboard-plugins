import { act, renderHook } from '@testing-library/react';
import { useDirtyFormState } from './use-dirty-form-state';

describe('useDirtyFormState', () => {
  it('starts clean: value equals the initial value and isDirty is false', () => {
    const { result } = renderHook(() => useDirtyFormState({ name: 'a' }));

    expect(result.current.value).toEqual({ name: 'a' });
    expect(result.current.isDirty).toBe(false);
  });

  it('marks isDirty once the value diverges from the baseline', () => {
    const { result } = renderHook(() => useDirtyFormState({ name: 'a' }));

    act(() => {
      result.current.setValue({ name: 'b' });
    });

    expect(result.current.value).toEqual({ name: 'b' });
    expect(result.current.isDirty).toBe(true);
  });

  it('setValue accepts an updater function, same as useState', () => {
    const { result } = renderHook(() => useDirtyFormState(1));

    act(() => {
      result.current.setValue(previous => previous + 1);
    });

    expect(result.current.value).toBe(2);
    expect(result.current.isDirty).toBe(true);
  });

  it('is clean again once the value is changed back to equal the baseline', () => {
    const { result } = renderHook(() => useDirtyFormState({ name: 'a' }));

    act(() => {
      result.current.setValue({ name: 'b' });
    });
    act(() => {
      result.current.setValue({ name: 'a' });
    });

    expect(result.current.isDirty).toBe(false);
  });

  it('commit() with no argument re-anchors the baseline to the current value, clearing isDirty', () => {
    const { result } = renderHook(() => useDirtyFormState({ name: 'a' }));

    act(() => {
      result.current.setValue({ name: 'b' });
    });
    act(() => {
      result.current.commit();
    });

    expect(result.current.value).toEqual({ name: 'b' });
    expect(result.current.isDirty).toBe(false);

    // The re-anchored baseline is what future edits are compared against.
    act(() => {
      result.current.setValue({ name: 'a' });
    });
    expect(result.current.isDirty).toBe(true);
  });

  it('commit(savedValue) replaces both the current value and the baseline with the saved value', () => {
    const { result } = renderHook(() => useDirtyFormState({ name: 'draft' }));

    act(() => {
      result.current.commit({ name: 'normalized-by-server' });
    });

    expect(result.current.value).toEqual({ name: 'normalized-by-server' });
    expect(result.current.isDirty).toBe(false);
  });

  it('reset() discards edits by restoring the value to the last committed baseline', () => {
    const { result } = renderHook(() => useDirtyFormState({ name: 'a' }));

    act(() => {
      result.current.setValue({ name: 'b' });
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.value).toEqual({ name: 'a' });
    expect(result.current.isDirty).toBe(false);
  });

  it('reset() after a commit() restores to the newly committed baseline, not the original initial value', () => {
    const { result } = renderHook(() => useDirtyFormState({ name: 'a' }));

    act(() => {
      result.current.setValue({ name: 'b' });
    });
    act(() => {
      result.current.commit();
    });
    act(() => {
      result.current.setValue({ name: 'c' });
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.value).toEqual({ name: 'b' });
  });

  it('uses a custom isEqual comparator instead of the default structural comparison when provided', () => {
    const { result } = renderHook(() =>
      useDirtyFormState(
        { name: 'a', updatedAt: 1 },
        (a, b) => a.name === b.name,
      ),
    );

    act(() => {
      // Differs only in a field the custom comparator ignores.
      result.current.setValue({ name: 'a', updatedAt: 2 });
    });

    expect(result.current.isDirty).toBe(false);

    act(() => {
      result.current.setValue({ name: 'b', updatedAt: 2 });
    });

    expect(result.current.isDirty).toBe(true);
  });

  it('default comparator treats structurally-equal-but-not-identical objects as clean', () => {
    const { result } = renderHook(() => useDirtyFormState({ name: 'a' }));

    act(() => {
      // A fresh object literal that is deep-equal to, but not reference-equal to, the baseline.
      result.current.setValue({ name: 'a' });
    });

    expect(result.current.isDirty).toBe(false);
  });
});
