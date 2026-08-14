import assert from 'node:assert/strict';
import { MANAGER_SESSION_EXPIRED_COPY } from '../../common/constants';
import { checkManagerSession } from './settings';

/**
 * `checkManagerSession` is a session-liveness probe. AI Assistant settings/providers are
 * authorized by the Wazuh indexer's own `plugin:wazuh/ai_assistant/settings/{read,write}`
 * permissions on the calling user's backend role (see
 * docs/ref/modules/ai-assistant/security.md). These cases prove the function resolves `ok: false`
 * only for a missing/expired `wz-token`, and `ok: true` in every other case — including "not an
 * administrator" — since that role no longer matters here.
 *
 * Runs under the platform Jest runner only: server/routes/settings.ts imports `@osd/config-schema`
 * as a runtime value (`schema.object(...)`, not just types), which resolves only inside a full
 * wazuh-dashboard checkout.
 *
 * There is no request/response-mocking harness for OpenSearch Dashboards routes in this plugin, so
 * this exercises the probe directly rather than a full route-level HTTP round-trip: it mocks only
 * the one thing it touches (`context.wazuh_core.dashboardSecurity.isAdministratorUser`), using
 * `Parameters<typeof checkManagerSession>` to pick up the real OSD parameter types without this
 * file having to import them from the (here, unavailable) `../../../../src/core/server` tree.
 */

type Context = Parameters<typeof checkManagerSession>[0];
type RouteRequest = Parameters<typeof checkManagerSession>[1];

function fakeContext(
  isAdministratorUser: () => Promise<{
    administrator: boolean;
    administrator_requirements: string | null;
  }>,
): Context {
  return {
    wazuh_core: { dashboardSecurity: { isAdministratorUser } },
  } as unknown as Context;
}

test('checkManagerSession: an administrator resolves ok', async () => {
  const context = fakeContext(() =>
    Promise.resolve({
      administrator: true,
      administrator_requirements: null,
    }),
  );
  const result = await checkManagerSession(context, {} as RouteRequest);
  assert.deepEqual(result, { ok: true });
});

test('checkManagerSession: a non-administrator with a live session resolves ok — role no longer matters', async () => {
  const context = fakeContext(() =>
    Promise.resolve({
      administrator: false,
      administrator_requirements: 'No administrator role',
    }),
  );
  const result = await checkManagerSession(context, {} as RouteRequest);
  assert.deepEqual(result, { ok: true });
});

test('checkManagerSession: "No permissions in token" also resolves ok', async () => {
  const context = fakeContext(() =>
    Promise.resolve({
      administrator: false,
      administrator_requirements: 'No permissions in token',
    }),
  );
  const result = await checkManagerSession(context, {} as RouteRequest);
  assert.deepEqual(result, { ok: true });
});

test('checkManagerSession: "No token provider" resolves not-ok with the actionable session-expired message', async () => {
  const context = fakeContext(() =>
    Promise.resolve({
      administrator: false,
      administrator_requirements: 'No token provider',
    }),
  );
  const result = await checkManagerSession(context, {} as RouteRequest);
  assert.equal(result.ok, false);
  assert.match(
    (result as { message: string }).message,
    /session is missing or expired/i,
  );
  assert.match(
    (result as { message: string }).message,
    /\(No token provider\)/,
  );
});

test('checkManagerSession: "Token is not valid" and "No API id provided" also resolve not-ok', async () => {
  for (const reason of ['Token is not valid', 'No API id provided']) {
    // eslint-disable-next-line no-await-in-loop
    const result = await checkManagerSession(
      fakeContext(() =>
        Promise.resolve({
          administrator: false,
          administrator_requirements: reason,
        }),
      ),
      {} as RouteRequest,
    );
    assert.equal(result.ok, false, `expected "${reason}" to resolve not-ok`);
  }
});

test('checkManagerSession: live-probe "...status code 401" maps to the same actionable copy', async () => {
  const raw =
    'It could not check if the current user is administrator due to: Request failed with status code 401';
  const context = fakeContext(() =>
    Promise.resolve({ administrator: false, administrator_requirements: raw }),
  );
  const result = await checkManagerSession(context, {} as RouteRequest);
  assert.equal(result.ok, false);
  assert.match(
    (result as { message: string }).message,
    /session is missing or expired/i,
  );
  assert.ok((result as { message: string }).message.includes(`(${raw})`));
});

test('checkManagerSession: "could not check" + "401" (no exact "status code 401" substring) also maps to not-ok', async () => {
  const raw = 'could not check administrator status: manager responded 401';
  const context = fakeContext(() =>
    Promise.resolve({ administrator: false, administrator_requirements: raw }),
  );
  const result = await checkManagerSession(context, {} as RouteRequest);
  assert.equal(result.ok, false);
});

test('checkManagerSession: an unrelated failure reason resolves ok — only token-shaped reasons are a session problem', async () => {
  const context = fakeContext(() =>
    Promise.resolve({
      administrator: false,
      administrator_requirements: 'Some unrelated internal error',
    }),
  );
  const result = await checkManagerSession(context, {} as RouteRequest);
  assert.deepEqual(result, { ok: true });
});

test('checkManagerSession: fails OPEN when the underlying check itself throws — this is a liveness probe, not a security gate', async () => {
  const context = fakeContext(() => {
    throw new Error('wazuh_core context not ready');
  });
  const result = await checkManagerSession(context, {} as RouteRequest);
  assert.deepEqual(result, { ok: true });
});

// Contract with the client-side heal/retry (public/services/session-heal.ts): every token-shaped
// reason must surface a copy containing MANAGER_SESSION_EXPIRED_COPY, or a future rewording would
// silently disable client healing.
test('every token-shaped reason carries the shared MANAGER_SESSION_EXPIRED_COPY substring', async () => {
  const tokenShapedReasons = [
    'No token provider',
    'Token is not valid',
    'No API id provided',
    'It could not check if the current user is administrator due to: Request failed with status code 401',
  ];
  for (const reason of tokenShapedReasons) {
    // eslint-disable-next-line no-await-in-loop
    const result = await checkManagerSession(
      fakeContext(() =>
        Promise.resolve({
          administrator: false,
          administrator_requirements: reason,
        }),
      ),
      {} as RouteRequest,
    );
    assert.equal(result.ok, false);
    assert.ok(
      (result as { message: string }).message.includes(
        MANAGER_SESSION_EXPIRED_COPY,
      ),
      `copy for "${reason}" lost the shared substring`,
    );
  }
});
