import { useRef, useState } from 'react';

/**
 * `useState` whose setter ALSO writes synchronously into a ref mirror, returned alongside it —
 * `[value, setValue, ref]`. Extracted from chat-page.tsx (quality pass, port/5.0), which had three
 * near-identical hand-rolled instances of exactly this pattern: `messages`/`messagesRef`/
 * `updateMessages`, `inputText`/`inputTextRef`/`setInputText`, and `activeConversationId`/
 * `activeConversationIdRef`/`setActiveConversationId`.
 *
 * WHY the ref mirror exists at all: several call sites need the JUST-SETTLED value from inside an
 * async callback (a `for await` stream loop, its `finally` block, a promise `.then`) that isn't
 * itself a React event handler, and can't simply wait for a fresh render to pick up a new prop/
 * closure — e.g. `persistConversationAfterTurn` reads `messagesRef.current` right after a stream
 * ends, and `handleSessionExpired` reads `inputTextRef.current` to stash the latest draft the
 * moment a 401 is detected. React 16 applies a functional `setState` updater SYNCHRONOUSLY when
 * called from outside a React event handler (which every one of those call sites is), so by the
 * time the setter below returns, `ref.current` already holds the new value — no waiting on a
 * render. The setter also accepts a plain value (as `useState`'s own setter does), not just an
 * updater function; both forms go through the same synchronous ref-write.
 */
export function useSyncedState<T>(
  initial: T,
): [T, (update: React.SetStateAction<T>) => void, React.MutableRefObject<T>] {
  const [value, setValue] = useState<T>(initial);
  const ref = useRef<T>(initial);

  const setSyncedValue = (update: React.SetStateAction<T>) => {
    setValue(current => {
      const next =
        typeof update === 'function'
          ? (update as (prev: T) => T)(current)
          : update;
      ref.current = next;
      return next;
    });
  };

  return [value, setSyncedValue, ref];
}
