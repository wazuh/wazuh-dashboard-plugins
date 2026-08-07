import { useCallback, useState } from 'react';

type Equality<T> = (a: T, b: T) => boolean;

/**
 * Structural fallback for callers that don't pass their own `isEqual`: reference-equal first
 * (cheap, and correct for primitives), then a `JSON.stringify` comparison for plain
 * serializable form values (objects/arrays of strings, numbers, booleans). Not sound for
 * values containing functions, `Date`s, `Map`/`Set`, or key-order-sensitive shapes — pass a
 * custom `isEqual` for those.
 */
const defaultIsEqual: Equality<unknown> = (a, b) =>
  a === b || JSON.stringify(a) === JSON.stringify(b);

export interface UseDirtyFormStateResult<T> {
  value: T;
  setValue: (update: React.SetStateAction<T>) => void;
  isDirty: boolean;
  /**
   * Moves the baseline to match the current value (or, if `savedValue` is given, moves BOTH the
   * current value and the baseline to it) and clears `isDirty`. Call this once a save round-trip
   * resolves, or right after loading fresh data from the server — either way, whatever is on
   * screen right now is no longer "unsaved changes".
   */
  commit: (savedValue?: T) => void;
  /** Discards edits by moving the current value back to the baseline. */
  reset: () => void;
}

/**
 * Tracks a form's current value alongside the value it was last saved (or loaded) as, deriving
 * `isDirty` from comparing the two instead of a hand-rolled boolean flag that every `onChange`
 * and every save handler has to remember to toggle. Extracted from settings-page.tsx, which had
 * this exact shape duplicated twice by hand: `privacyDraft`/`isPrivacyDirty` and
 * `retentionDraft`/`isRetentionDirty`, each requiring `setIsXDirty(true)` at every field
 * `onChange` and `setIsXDirty(false)` at the end of every successful save — easy to forget at a
 * newly added field, which would silently leave the Save button permanently enabled or disabled.
 *
 * `commit` is the piece a plain `useState` doesn't give you: it re-anchors "unsaved changes" to
 * whatever was just persisted, whether that's the value already on screen (`commit()`, typical
 * after a save that echoes the input back) or a fresh value from the server (`commit(saved)`,
 * typical when a save/reload returns a normalized copy that should replace the draft outright).
 */
export function useDirtyFormState<T>(
  initialValue: T,
  isEqual: Equality<T> = defaultIsEqual as Equality<T>,
): UseDirtyFormStateResult<T> {
  const [baseline, setBaseline] = useState<T>(initialValue);
  const [value, setValue] = useState<T>(initialValue);

  const commit = useCallback((savedValue?: T) => {
    setValue(current => {
      const next = savedValue === undefined ? current : savedValue;
      setBaseline(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setValue(baseline);
  }, [baseline]);

  return {
    value,
    setValue,
    isDirty: !isEqual(value, baseline),
    commit,
    reset,
  };
}
