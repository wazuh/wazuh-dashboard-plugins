import assert from 'node:assert/strict';
import {
  buildDraftStashKey,
  KeyValueStorage,
  NavigationType,
  restoreAndClearDraft,
  stashDraft,
} from './draft-stash';

/** Minimal in-memory fake satisfying `KeyValueStorage` (the same structural subset of DOM
 * `Storage` this module needs) — lets these tests run under plain Jest with no browser global
 * required. */
function fakeStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: key => (data.has(key) ? data.get(key)! : null),
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: key => {
      data.delete(key);
    },
    key: index => Array.from(data.keys())[index] ?? null,
    get length() {
      return data.size;
    },
  };
}

/** The marker key `stashDraft` arms and `restoreAndClearDraft` consumes — not exported (it's an
 * internal implementation detail of the module), so tests that need to simulate storage state
 * directly (rather than going through `stashDraft`) reproduce it here by its known literal value. */
const RELOAD_EXPECTED_KEY = 'wazuhAiAssistant.chatDraft.reloadExpected';

test('buildDraftStashKey: a real conversation id is embedded in the key', () => {
  assert.equal(
    buildDraftStashKey('abc-123'),
    'wazuhAiAssistant.chatDraft.abc-123',
  );
});

test('buildDraftStashKey: null (never-yet-saved conversation) uses the "_new" sentinel', () => {
  assert.equal(buildDraftStashKey(null), 'wazuhAiAssistant.chatDraft._new');
});

test('stashDraft: writes a non-blank draft under the conversation-scoped key', () => {
  const storage = fakeStorage();
  stashDraft(storage, 'conv-1', 'unsent question');
  assert.equal(
    storage.getItem(buildDraftStashKey('conv-1')),
    'unsent question',
  );
});

test('stashDraft: arms the reload-expected marker alongside a non-blank draft', () => {
  const storage = fakeStorage();
  stashDraft(storage, 'conv-1', 'unsent question');
  assert.equal(storage.getItem(RELOAD_EXPECTED_KEY), '1');
});

test('stashDraft: a blank/whitespace-only draft CLEARS the slot instead of stashing it', () => {
  const storage = fakeStorage({
    [buildDraftStashKey('conv-1')]: 'stale draft',
  });
  stashDraft(storage, 'conv-1', '   ');
  assert.equal(storage.getItem(buildDraftStashKey('conv-1')), null);
});

test('stashDraft: a blank draft also disarms the reload-expected marker', () => {
  const storage = fakeStorage({ [RELOAD_EXPECTED_KEY]: '1' });
  stashDraft(storage, 'conv-1', '');
  assert.equal(storage.getItem(RELOAD_EXPECTED_KEY), null);
});

// --- Reload-gating: restoreAndClearDraft must only restore across the ONE reload it was armed for ---

test('restoreAndClearDraft: DOES restore when a real reload is armed and reported (matching key)', () => {
  const storage = fakeStorage();
  stashDraft(storage, 'conv-1', 'my draft');
  const restored = restoreAndClearDraft(storage, 'conv-1', 'reload');
  assert.equal(restored, 'my draft');
  assert.equal(storage.getItem(buildDraftStashKey('conv-1')), null);
});

test('restoreAndClearDraft: DOES restore across the fallback scan when conversationId resets to null on reload', () => {
  // Simulates the real reload scenario this fallback exists for: the draft was stashed while
  // conversation "conv-1" was active, but a genuine reload always remounts ChatPage with
  // activeConversationId back to null (this plugin does not deep-link a conversation id into the
  // URL).
  const storage = fakeStorage();
  stashDraft(storage, 'conv-1', 'my draft');
  const restored = restoreAndClearDraft(storage, null, 'reload');
  assert.equal(restored, 'my draft');
  assert.equal(storage.getItem(buildDraftStashKey('conv-1')), null);
});

test('restoreAndClearDraft: identity/conversation mismatch does NOT restore — navigationType is not "reload" (plain remount)', () => {
  // The app shell remounts ChatPage on
  // every Chat<->Settings tab switch, which is not a browser reload at all — navigationType stays
  // whatever the page's actual last navigation was, never flips to 'reload' on its own.
  const storage = fakeStorage();
  stashDraft(storage, 'conv-1', 'my draft');
  const restored = restoreAndClearDraft(storage, null, 'navigate');
  assert.equal(restored, null);
});

test('restoreAndClearDraft: identity/conversation mismatch does NOT restore — reload reported but marker missing', () => {
  // A genuine 'reload' navigation type with no armed marker means this reload was never solicited
  // by our own stash (e.g. an unrelated reload days later, or a marker already consumed by an
  // earlier mount) — restoring here would hand a draft stashed by an earlier session to whoever
  // mounts next.
  const storage = fakeStorage({
    [buildDraftStashKey('conv-1')]: 'leftover draft',
  });
  const restored = restoreAndClearDraft(storage, null, 'reload');
  assert.equal(restored, null);
});

test('restoreAndClearDraft: back_forward navigation does NOT restore even with the marker armed', () => {
  const storage = fakeStorage();
  stashDraft(storage, 'conv-1', 'my draft');
  const restored = restoreAndClearDraft(storage, null, 'back_forward');
  assert.equal(restored, null);
});

test('restoreAndClearDraft: default navigationType ("unknown", an un-updated call site) fails safe and does NOT restore', () => {
  const storage = fakeStorage();
  stashDraft(storage, 'conv-1', 'my draft');
  const restored = restoreAndClearDraft(storage, null);
  assert.equal(restored, null);
});

// --- Stale keys get cleared whenever restoration does not proceed ---

test('restoreAndClearDraft: clears ALL stashed keys (drafts + marker) when navigationType is not a solicited reload', () => {
  const storage = fakeStorage({
    [buildDraftStashKey('conv-1')]: 'draft A',
    [buildDraftStashKey('conv-2')]: 'draft B',
    [buildDraftStashKey(null)]: 'draft C',
    [RELOAD_EXPECTED_KEY]: '1',
  });
  const restored = restoreAndClearDraft(storage, null, 'navigate');
  assert.equal(restored, null);
  assert.equal(storage.length, 0);
});

test('restoreAndClearDraft: this clear-everything branch is also what covers a fresh session start (no reload evidence at all)', () => {
  // A fresh login in the same tab is, from this module's point of view, indistinguishable from any
  // other non-reload mount — no navigationType of 'reload' is ever reported for it, so it falls
  // into the same defensive clear as every other non-qualifying case — there is no separate
  // "fresh session" code path because none is needed.
  const storage = fakeStorage({
    [buildDraftStashKey('conv-1')]: "analyst A's leftover draft",
    [RELOAD_EXPECTED_KEY]: '1',
  });
  const restored = restoreAndClearDraft(storage, null, 'navigate');
  assert.equal(restored, null);
  assert.equal(storage.getItem(buildDraftStashKey('conv-1')), null);
  assert.equal(storage.getItem(RELOAD_EXPECTED_KEY), null);
});

test('restoreAndClearDraft: ignores unrelated keys under a different prefix during the scan', () => {
  const storage = fakeStorage({ 'someOtherPlugin.setting': 'unrelated' });
  assert.equal(restoreAndClearDraft(storage, null, 'reload'), null);
  // Not ours to touch: still present after the (no-op) restore attempt.
  assert.equal(storage.getItem('someOtherPlugin.setting'), 'unrelated');
});

test('restoreAndClearDraft: returns null and leaves storage untouched when nothing is stashed', () => {
  const storage = fakeStorage();
  assert.equal(restoreAndClearDraft(storage, 'conv-1', 'reload'), null);
  assert.equal(storage.length, 0);
});

test('restoreAndClearDraft: never restores the same draft twice, even across two "reload" calls', () => {
  const storage = fakeStorage();
  stashDraft(storage, null, 'draft');
  assert.equal(restoreAndClearDraft(storage, null, 'reload'), 'draft');
  // The marker was consumed by the first call, so a second "reload" report (however it happened)
  // finds no armed marker and takes the clear-everything branch rather than re-restoring.
  assert.equal(restoreAndClearDraft(storage, null, 'reload'), null);
});

test('restoreAndClearDraft: a matching preferred-key restore still requires a solicited reload (matching case DOES restore)', () => {
  const storage = fakeStorage();
  stashDraft(storage, 'conv-1', 'my draft');
  // Sanity: the same call with no reload evidence at all does not restore, even though the key
  // matches exactly.
  assert.equal(restoreAndClearDraft(storage, 'conv-1', 'navigate'), null);
});

const unqualifyingNavigationTypes: NavigationType[] = [
  'navigate',
  'back_forward',
  'prerender',
  'unknown',
];
for (const navigationType of unqualifyingNavigationTypes) {
  test(`restoreAndClearDraft: navigationType "${navigationType}" never restores, even with the marker armed`, () => {
    const storage = fakeStorage();
    stashDraft(storage, 'conv-1', 'my draft');
    assert.equal(restoreAndClearDraft(storage, 'conv-1', navigationType), null);
  });
}

// --- the "at most one draft waiting" invariant is now ENFORCED, not assumed ----------------------
// Regression cover: two session-expiry events for two DIFFERENT conversations before the reload used
// to leave both keys present, and the fallback scan returned whichever storage enumerated first —
// the STALE draft, restored into the wrong conversation, with the current one orphaned.
/** Enumerates the draft keys currently present, using only the `KeyValueStorage` surface. */
function draftKeysIn(storage: KeyValueStorage): string[] {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (
      key &&
      key.startsWith('wazuhAiAssistant.chatDraft') &&
      key !== RELOAD_EXPECTED_KEY
    ) {
      keys.push(key);
    }
  }
  return keys;
}

test('stashing a second draft clears the first, so the NEWEST wins on restore', () => {
  const storage = fakeStorage();
  stashDraft(storage, 'conversation-A', 'draft for A');
  stashDraft(storage, 'conversation-B', 'draft for B');
  assert.deepEqual(draftKeysIn(storage), [
    buildDraftStashKey('conversation-B'),
  ]);
  assert.equal(
    restoreAndClearDraft(storage, 'conversation-B', 'reload'),
    'draft for B',
  );
});

test('the superseded draft is unreachable — the fallback scan can never surface the stale one', () => {
  const storage = fakeStorage();
  stashDraft(storage, 'conversation-A', 'draft for A');
  stashDraft(storage, 'conversation-B', 'draft for B');
  // Restoring while "on" conversation A still goes through the fallback scan (a real reload resets
  // the active conversation id, which is exactly why that scan exists), so it legitimately returns
  // the ONE remaining draft. The property that matters is that the superseded 'draft for A' is gone
  // and can never be resurrected — before the fix, this returned 'draft for A' and orphaned B's.
  const restored = restoreAndClearDraft(storage, 'conversation-A', 'reload');
  assert.notEqual(restored, 'draft for A');
  assert.equal(restored, 'draft for B');
});
