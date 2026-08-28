import assert from 'node:assert/strict';
import { resolveApiHostId } from './api-host';

/**
 * Proves
 * `resolveApiHostId` now cross-checks a client-supplied `wz-api` cookie against the actually
 * configured host list (`context.wazuh_core.manageHosts.get()`) instead of returning it verbatim,
 * falls back to the first configured host both when the cookie is absent and when it names an
 * unrecognized host, and that `parseCookie` strips RFC 6265
 * quoted-string wrapping (`wz-api="value"` -> `value`) before that comparison runs.
 *
 * Unlike server/routes/conversations-owner-resolution.test.ts and provider-admin-gate.test.ts,
 * server/tools/api-host.ts has NO runtime (value) import of `@osd/config-schema` or any other
 * OSD-tree-only module -- its only import of `../../../../src/core/server` is type-only
 * (`OpenSearchDashboardsRequest`/`RequestHandlerContext`), which TypeScript erases entirely from
 * the emitted JS. That makes this file runnable standalone via `node --experimental-strip-types`,
 * without a dashboard checkout — unlike the conversations.ts and settings.ts route-handler tests,
 * which need the platform runner.
 */

type Context = Parameters<typeof resolveApiHostId>[0];
type RouteRequest = Parameters<typeof resolveApiHostId>[1];

/** Minimal `context` stub: `resolveApiHostId` only ever reads
 * `context.wazuh_core.manageHosts.get()`. */
function fakeContext(hosts: Array<{ id: string }>): Context {
  return {
    wazuh_core: {
      manageHosts: {
        get: () => Promise.resolve(hosts),
      },
    },
  } as unknown as Context;
}

/** Minimal `request` stub: only `request.headers.cookie` is ever read. */
function fakeRequest(cookieHeader?: string): RouteRequest {
  return {
    headers: cookieHeader === undefined ? {} : { cookie: cookieHeader },
  } as unknown as RouteRequest;
}

test('resolveApiHostId: returns the cookie value when it names a configured host', async () => {
  const context = fakeContext([{ id: 'host-1' }, { id: 'host-2' }]);
  const request = fakeRequest('wz-api=host-2; other=x');
  const hostId = await resolveApiHostId(context, request);
  assert.equal(hostId, 'host-2');
});

test('resolveApiHostId: falls back to the first configured host when no cookie is present', async () => {
  const context = fakeContext([{ id: 'host-1' }, { id: 'host-2' }]);
  const request = fakeRequest(undefined);
  const hostId = await resolveApiHostId(context, request);
  assert.equal(hostId, 'host-1');
});

// The core case: an unrecognized cookie value must not be returned verbatim -- it has to be
// checked against the configured host list.
test('resolveApiHostId: falls back to the first configured host when the cookie names an UNRECOGNIZED host', async () => {
  const context = fakeContext([{ id: 'host-1' }, { id: 'host-2' }]);
  const request = fakeRequest('wz-api=attacker-supplied-host');
  const hostId = await resolveApiHostId(context, request);
  assert.equal(hostId, 'host-1');
  assert.notEqual(hostId, 'attacker-supplied-host');
});

test('resolveApiHostId: falls back to the first configured host when the cookie is empty', async () => {
  const context = fakeContext([{ id: 'host-1' }]);
  const request = fakeRequest('wz-api=; other=y');
  const hostId = await resolveApiHostId(context, request);
  assert.equal(hostId, 'host-1');
});

test('resolveApiHostId: throws when no host is configured at all', async () => {
  const context = fakeContext([]);
  const request = fakeRequest(undefined);
  await assert.rejects(
    () => resolveApiHostId(context, request),
    /No Wazuh manager host is configured/,
  );
});

// --- RFC 6265 quoted-string cookie-value stripping ------------------------------------------

test('resolveApiHostId: strips RFC 6265 quoted-string wrapping before validating against configured hosts', async () => {
  const context = fakeContext([{ id: 'host-2' }]);
  const request = fakeRequest('wz-api="host-2"');
  const hostId = await resolveApiHostId(context, request);
  assert.equal(hostId, 'host-2');
});

test('resolveApiHostId: a quoted-but-unrecognized cookie value still falls back to the default host', async () => {
  const context = fakeContext([{ id: 'host-1' }]);
  const request = fakeRequest('wz-api="attacker-supplied-host"');
  const hostId = await resolveApiHostId(context, request);
  assert.equal(hostId, 'host-1');
});

test('resolveApiHostId: a percent-encoded quoted cookie value is decoded then unwrapped', async () => {
  const context = fakeContext([{ id: 'host-2' }]);
  // `%22host-2%22` decodes to `"host-2"` before the quoted-string strip runs.
  const request = fakeRequest('wz-api=%22host-2%22');
  const hostId = await resolveApiHostId(context, request);
  assert.equal(hostId, 'host-2');
});
