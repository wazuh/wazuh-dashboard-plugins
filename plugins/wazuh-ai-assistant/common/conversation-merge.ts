/**
 * Pure longest-common-prefix merge for concurrent conversation edits (Fix 1, optimistic
 * concurrency on `PUT /conversations/{id}` — server/routes/conversations.ts, public/components/
 * chat/chat-page.tsx). Kept dependency-free and under common/ specifically so unit tests
 * (colocated as conversation-merge.test.ts) can import it directly — tsconfig.test.json only
 * includes common/** and server/**, not public/** (same convention as common/discover-url.ts).
 *
 * Two tabs holding the SAME conversation can both append turns before either saves; a 409 from the
 * server (version conflict) means the OTHER tab's write already landed under a newer version. This
 * merge assumes both message arrays share a common history up to some point (the last state either
 * tab loaded/saved) and diverge only in what each tab appended AFTER that:
 *
 *   merged = server messages + (this tab's local messages strictly after the longest run both
 *            arrays share from the start)
 *
 * This is a heuristic, not a true three-way merge: if the two arrays diverge in the MIDDLE rather
 * than by one simply appending past where the other stopped, everything from the first mismatch
 * onward is treated as "this tab's own new turns" and appended after the server's copy — which can
 * duplicate or reorder content in that pathological case. For the actual failure mode this fixes
 * (two tabs open the same resumed conversation and each simply appends new turns), the common
 * prefix is exactly the server history as of the losing tab's last read, so the merge is exact.
 */
import { ChatMessage } from './types';

/** Structural equality for one message — deliberately NOT reference equality, since the two arrays
 * being merged are independently-fetched/independently-held copies, never the same object. */
function messagesEqual(a: ChatMessage, b: ChatMessage): boolean {
  return (
    a.role === b.role &&
    a.content === b.content &&
    a.toolCallId === b.toolCallId &&
    JSON.stringify(a.toolCalls ?? null) === JSON.stringify(b.toolCalls ?? null)
  );
}

/** Length of the longest prefix `server` and `local` agree on, message-by-message. */
function longestCommonPrefixLength(
  server: ChatMessage[],
  local: ChatMessage[],
): number {
  const max = Math.min(server.length, local.length);
  let i = 0;
  while (i < max && messagesEqual(server[i], local[i])) {
    i += 1;
  }
  return i;
}

/**
 * Merges the server's just-fetched copy of a conversation with this tab's own in-memory messages
 * after a 409 version conflict. Degenerate cases, both handled by the same general logic below
 * (no special-casing needed):
 *  - Identical arrays: the common prefix covers everything, so `local`'s tail is empty and the
 *    server copy is returned unchanged.
 *  - No common prefix at all (`prefixLength === 0`, e.g. reconciling against a row this tab never
 *    actually read before): returns the server messages followed by EVERY local message — the
 *    safest "don't drop anything" fallback.
 */
export function mergeConversationMessages(
  serverMessages: ChatMessage[],
  localMessages: ChatMessage[],
): ChatMessage[] {
  const prefixLength = longestCommonPrefixLength(serverMessages, localMessages);
  const localTail = localMessages.slice(prefixLength);
  return [...serverMessages, ...localTail];
}
