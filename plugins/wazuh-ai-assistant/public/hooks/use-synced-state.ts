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
 * moment a 401 is detected.
 *
 * The ref — NOT React state — is the authoritative current value here, and the updater runs against
 * `ref.current` OUTSIDE `setValue`. It cannot run inside the `setValue` updater: this app mounts
 * with React 18 `createRoot` (public/application.tsx), which batches updates from async contexts
 * and only evaluates an updater eagerly while the fiber has no pending lanes. The second and later
 * setter calls within one batch therefore deferred their updater — and with it the ref write — so
 * `ref.current` silently skipped values. That is exactly the "several commits in one batch" shape
 * `runChatStream`'s rAF-batched delta flush produces on a fast provider, and it made
 * `persistConversationAfterTurn` save a transcript with the answer's tail missing.
 *
 * Computing `next` here keeps the ref write synchronous with the setter call for every update,
 * batched or not. Every mutation of the value goes through this setter, so `ref.current` is always
 * the latest value and is a correct base for the updater. The setter also accepts a plain value (as
 * `useState`'s own setter does), not just an updater function; both forms take the same path.
 */
export function useSyncedState<T>(
  initial: T,
): [T, (update: React.SetStateAction<T>) => void, React.MutableRefObject<T>] {
  const [value, setValue] = useState<T>(initial);
  const ref = useRef<T>(initial);

  const setSyncedValue = (update: React.SetStateAction<T>) => {
    const next =
      typeof update === 'function'
        ? (update as (prev: T) => T)(ref.current)
        : update;
    ref.current = next;
    setValue(next);
  };

  return [value, setSyncedValue, ref];
}
