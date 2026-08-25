import assert from 'node:assert/strict';
import { resolveOwner } from './conversations';
import { resolveChatStreamUser } from './chat';
import type {
  RequestHandlerContext,
  OpenSearchDashboardsRequest,
} from '../../../../src/core/server';

/**
 * `resolveOwner` must return `undefined` for an unresolved identity -- an explicit "could not
 * resolve a real user" signal -- and never the shared `CONVERSATION_OWNER_FALLBACK` sentinel.
 * Bucketing every unresolved caller under one owner would let them read, overwrite and delete each
 * other's saved conversations. Failing closed on that `undefined` is each ROUTE handler's job (see
 * conversations.ts's `ownerUnresolvedResponse`, used by list/get/put/delete; `create` is the one
 * deliberate exception, see its call site).
 *
 * `resolveOwner` gates FIVE routes now, not four: list/get/put/delete, plus the rename (PATCH)
 * route added for issue #9010 -- see that route's own doc comment in conversations.ts for why it
 * copies this exact resolveOwner/ownerUnresolvedResponse/findConversationHit sequence rather than
 * inventing its own. Every case below therefore also documents that fifth route's authorization,
 * with no separate rename-specific owner test needed.
 *
 * These cases exercise `resolveOwner` directly, the same convention
 * conversations-version-conflict.test.ts uses for `isVersionConflictError`: the plugin
 * has no request/response-mocking layer for OpenSearch Dashboards routes, so route-level behavior
 * (the actual 403 status and body from a real HTTP call) is not covered here. `resolveOwner` only
 * ever reads `context.wazuh.security.getCurrentUser(request, context)` -- now via the shared core
 * `server/identity.ts`'s `resolveWazuhUsername`, see that file's doc comment -- so a minimal
 * object shaped like just that -- cast through `unknown` -- is enough to exercise every branch
 * without needing the real (much larger) OSD context/request types spelled out.
 *
 * Also covers the CHAT-side fallback (`server/routes/chat.ts`'s `resolveChatStreamUser`), which
 * shares the exact same `resolveWazuhUsername` core but deliberately makes the OPPOSITE fallback
 * choice from `resolveOwner` -- see server/identity.ts's top doc comment for why that difference
 * is a real security property and must survive exactly: `resolveOwner` fails closed to
 * `undefined`, `resolveChatStreamUser` falls back to the `CONVERSATION_OWNER_FALLBACK` sentinel
 * (safe there only because it is used purely as a rate-limit bucket key, never an authorization
 * decision).
 *
 * Runs under the platform Jest runner only: server/routes/conversations.ts and
 * server/routes/chat.ts both have a module-level value import of `@osd/config-schema` (used to
 * build their route body/query schemas), which resolves only inside a full wazuh-dashboard
 * checkout.
 * `RequestHandlerContext`/`OpenSearchDashboardsRequest` are imported as types only, so they erase
 * from the emitted JS and add no further runtime dependency of their own.
 */

function fakeContext(
  getCurrentUser?: (
    request: OpenSearchDashboardsRequest,
    context: RequestHandlerContext,
  ) => Promise<{ username?: string } | string | undefined>,
): RequestHandlerContext {
  return {
    wazuh: { security: { getCurrentUser } },
  } as unknown as RequestHandlerContext;
}

const fakeRequest = {} as OpenSearchDashboardsRequest;

test('resolveOwner: returns the username when getCurrentUser resolves a plain string', async () => {
  const context = fakeContext(() => Promise.resolve('alice'));
  const owner = await resolveOwner(context, fakeRequest);
  assert.equal(owner, 'alice');
});

test('resolveOwner: returns the username when getCurrentUser resolves a {username} object', async () => {
  const context = fakeContext(() => Promise.resolve({ username: 'bob' }));
  const owner = await resolveOwner(context, fakeRequest);
  assert.equal(owner, 'bob');
});

test('resolveOwner: returns undefined (NOT the shared sentinel) when getCurrentUser resolves undefined', async () => {
  const context = fakeContext(() => Promise.resolve(undefined));
  const owner = await resolveOwner(context, fakeRequest);
  assert.equal(owner, undefined);
  assert.notEqual(owner, '_shared');
});

test('resolveOwner: returns undefined when getCurrentUser resolves an empty username', async () => {
  const context = fakeContext(() => Promise.resolve({ username: '' }));
  const owner = await resolveOwner(context, fakeRequest);
  assert.equal(owner, undefined);
});

test('resolveOwner: returns undefined, never throws, when getCurrentUser itself throws', async () => {
  const context = fakeContext(() => {
    throw new Error('wazuh_core context not ready');
  });
  await assert.doesNotReject(async () => {
    const owner = await resolveOwner(context, fakeRequest);
    assert.equal(owner, undefined);
  });
});

test('resolveOwner: returns undefined when the wazuh main-plugin context surface is entirely absent', async () => {
  const context = {} as unknown as RequestHandlerContext;
  const owner = await resolveOwner(context, fakeRequest);
  assert.equal(owner, undefined);
});

test('resolveOwner: returns undefined when context.wazuh.security is present but getCurrentUser is not', async () => {
  const context = {
    wazuh: { security: {} },
  } as unknown as RequestHandlerContext;
  const owner = await resolveOwner(context, fakeRequest);
  assert.equal(owner, undefined);
});

// The only remaining path to a row stamped with CONVERSATION_OWNER_FALLBACK ('_shared') was a
// real dashboard account literally named `_shared` -- resolveOwner must now treat that resolved
// username itself as UNRESOLVED rather than as a real identity, so it can never pass an
// owner-CHECKING route's comparison against the shared-fallback-stamped rows.
test('resolveOwner: treats a resolved username literally equal to the "_shared" sentinel as UNRESOLVED (plain string)', async () => {
  const context = fakeContext(() => Promise.resolve('_shared'));
  const owner = await resolveOwner(context, fakeRequest);
  assert.equal(owner, undefined);
});

test('resolveOwner: treats a resolved username literally equal to the "_shared" sentinel as UNRESOLVED ({username} object)', async () => {
  const context = fakeContext(() => Promise.resolve({ username: '_shared' }));
  const owner = await resolveOwner(context, fakeRequest);
  assert.equal(owner, undefined);
});

test('resolveOwner: a username that merely CONTAINS "_shared" (not an exact match) still resolves normally', async () => {
  const context = fakeContext(() => Promise.resolve('not_shared_at_all'));
  const owner = await resolveOwner(context, fakeRequest);
  assert.equal(owner, 'not_shared_at_all');
});

// --- resolveChatStreamUser (chat.ts) -- shares identity.ts's core with resolveOwner above, but
// deliberately makes the OPPOSITE fallback choice on an unresolved identity: a rate-limit bucket
// key (CONVERSATION_OWNER_FALLBACK), never an authorization decision. See server/identity.ts's
// top doc comment and resolveChatStreamUser's own doc comment in chat.ts for the full rationale.

test('resolveChatStreamUser: returns the username when getCurrentUser resolves a plain string', async () => {
  const context = fakeContext(() => Promise.resolve('alice'));
  const user = await resolveChatStreamUser(context, fakeRequest);
  assert.equal(user, 'alice');
});

test('resolveChatStreamUser: returns the username when getCurrentUser resolves a {username} object', async () => {
  const context = fakeContext(() => Promise.resolve({ username: 'bob' }));
  const user = await resolveChatStreamUser(context, fakeRequest);
  assert.equal(user, 'bob');
});

test('resolveChatStreamUser: falls back to the CONVERSATION_OWNER_FALLBACK sentinel (NOT undefined) when getCurrentUser resolves undefined', async () => {
  const context = fakeContext(() => Promise.resolve(undefined));
  const user = await resolveChatStreamUser(context, fakeRequest);
  assert.equal(user, '_shared');
});

test('resolveChatStreamUser: falls back to the sentinel when getCurrentUser resolves an empty username', async () => {
  const context = fakeContext(() => Promise.resolve({ username: '' }));
  const user = await resolveChatStreamUser(context, fakeRequest);
  assert.equal(user, '_shared');
});

test('resolveChatStreamUser: falls back to the sentinel, never throws, when getCurrentUser itself throws', async () => {
  const context = fakeContext(() => {
    throw new Error('wazuh_core context not ready');
  });
  await assert.doesNotReject(async () => {
    const user = await resolveChatStreamUser(context, fakeRequest);
    assert.equal(user, '_shared');
  });
});

test('resolveChatStreamUser: falls back to the sentinel when the wazuh main-plugin context surface is entirely absent', async () => {
  const context = {} as unknown as RequestHandlerContext;
  const user = await resolveChatStreamUser(context, fakeRequest);
  assert.equal(user, '_shared');
});

// The security-relevant divergence point: a real dashboard
// account literally named "_shared" must resolve to the SAME sentinel bucket key on the chat side
// (safe -- it's only a rate-limit bucket, and colliding with the deployment-wide fallback bucket
// merely shares a rate-limit budget) while resolving to UNDEFINED (fail-closed, 403) on the owner
// side (unsafe to treat as a real identity there -- see resolveOwner's doc comment).
test('resolveChatStreamUser: a real username literally equal to the "_shared" sentinel resolves to that SAME sentinel (contrast with resolveOwner, which fails closed to undefined)', async () => {
  const context = fakeContext(() => Promise.resolve('_shared'));
  const chatUser = await resolveChatStreamUser(context, fakeRequest);
  const owner = await resolveOwner(context, fakeRequest);
  assert.equal(chatUser, '_shared');
  assert.equal(owner, undefined);
});
