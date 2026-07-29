import assert from 'node:assert/strict';
import { requireAdministrator } from './settings';

/**
 * The shared admin gate `requireAdministrator` is the first statement in all five provider
 * mutation and test routes (POST /providers, PUT /providers/{id}, POST /providers/{id}/default,
 * DELETE /providers/{id}, POST /providers/{id}/test). These cases prove it rejects a
 * non-administrator, admits an administrator, and fails CLOSED when the underlying check throws.
 *
 * Runs under the platform Jest runner only: server/routes/settings.ts imports `@osd/config-schema`
 * as a runtime value (`schema.object(...)`, not just types), which resolves only inside a full
 * wazuh-dashboard checkout.
 *
 * There is no request/response-mocking harness for OpenSearch Dashboards routes in this plugin, so
 * this exercises the gating helper directly rather than a full route-level HTTP round-trip: it mocks
 * only the two things the helper touches (`context.wazuh_core.dashboardSecurity.isAdministratorUser`
 * and a `response.forbidden` recorder), using `Parameters<typeof requireAdministrator>` to pick up
 * the real OSD parameter types without this file having to import them from the (here,
 * unavailable) `../../../../src/core/server` tree itself.
 */

type Context = Parameters<typeof requireAdministrator>[0];
type RouteRequest = Parameters<typeof requireAdministrator>[1];
type ResponseFactory = Parameters<typeof requireAdministrator>[2];

/** Minimal `context` stub: `requireAdministrator` (via the file-private `checkAdministrator`) only
 * ever reads `context.wazuh_core.dashboardSecurity.isAdministratorUser`. */
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

/** Minimal `response` stub: `requireAdministrator` only ever calls `response.forbidden(...)`.
 * Records every call so tests can assert on exactly what would be sent to the client -- mirrors
 * server/providers/retry.test.ts's `fakeResponse` convention of building a plain object shaped like what
 * the code under test needs, then casting it to the real type at the call site. */
function fakeResponse(): {
  calls: Array<{ body: { message: string } }>;
  factory: ResponseFactory;
} {
  const calls: Array<{ body: { message: string } }> = [];
  const factory = {
    forbidden(options: { body: { message: string } }) {
      calls.push(options);
      return { status: 403, ...options };
    },
  } as unknown as ResponseFactory;
  return { calls, factory };
}

test('requireAdministrator: an administrator proceeds (resolves null, never calls response.forbidden)', async () => {
  const context = fakeContext(() =>
    Promise.resolve({
      administrator: true,
      administrator_requirements: null,
    }),
  );
  const response = fakeResponse();
  const gate = await requireAdministrator(
    context,
    {} as RouteRequest,
    response.factory,
  );
  assert.equal(gate, null);
  assert.equal(
    response.calls.length,
    0,
    'an administrator must never trigger a forbidden response',
  );
});

test('requireAdministrator: a non-administrator is rejected via response.forbidden with an actionable message', async () => {
  const context = fakeContext(() =>
    Promise.resolve({
      administrator: false,
      administrator_requirements: 'No administrator role',
    }),
  );
  const response = fakeResponse();
  const gate = await requireAdministrator(
    context,
    {} as RouteRequest,
    response.factory,
  );
  assert.ok(gate, 'expected a forbidden response to be returned, not null');
  assert.equal(response.calls.length, 1);
  assert.match(response.calls[0].body.message, /administrator role/i);
});

test('requireAdministrator: fails CLOSED when the underlying administrator check itself throws', async () => {
  const context = fakeContext(() => {
    throw new Error('wazuh_core context not ready');
  });
  const response = fakeResponse();
  const gate = await requireAdministrator(
    context,
    {} as RouteRequest,
    response.factory,
  );
  assert.ok(
    gate,
    'a thrown check must still be treated as "not an administrator", never as "proceed"',
  );
  assert.equal(response.calls.length, 1);
  assert.match(response.calls[0].body.message, /precaution/i);
});

test('requireAdministrator: propagates the exact describeAdministratorRequirement mapping (token-missing reason)', async () => {
  const context = fakeContext(() =>
    Promise.resolve({
      administrator: false,
      administrator_requirements: 'No token provider',
    }),
  );
  const response = fakeResponse();
  await requireAdministrator(context, {} as RouteRequest, response.factory);
  assert.equal(response.calls.length, 1);
  assert.match(
    response.calls[0].body.message,
    /session is missing or expired/i,
  );
});

test('requireAdministrator: an unrelated failure reason still falls back to the generic actionable message', async () => {
  const context = fakeContext(() =>
    Promise.resolve({
      administrator: false,
      administrator_requirements: 'Some unrelated internal error',
    }),
  );
  const response = fakeResponse();
  await requireAdministrator(context, {} as RouteRequest, response.factory);
  assert.equal(response.calls.length, 1);
  assert.match(
    response.calls[0].body.message,
    /Administrator privileges are required/,
  );
});

test('requireAdministrator: rejects a non-boolean truthy `administrator` value (e.g. the string "false")', async () => {
  // The upstream contract
  // types `administrator` as boolean but enforces nothing about it at runtime. A plain JS
  // truthiness check would grant admin for ANY truthy value, including the string "false" (truthy
  // in JS despite its name). `checkAdministrator`'s `administrator === true` strict check must
  // reject this exact non-boolean-but-truthy shape rather than let it slip through as an admin.
  const context = fakeContext(() =>
    Promise.resolve({
      // Cast past the (accurate) `boolean` type so this test can exercise the exact
      // untrusted-at-runtime shape the fix guards against.
      administrator: 'false' as unknown as boolean,
      administrator_requirements: 'No administrator role',
    }),
  );
  const response = fakeResponse();
  const gate = await requireAdministrator(
    context,
    {} as RouteRequest,
    response.factory,
  );
  assert.ok(
    gate,
    'a non-boolean truthy "administrator" value must still be rejected, not treated as true',
  );
  assert.equal(response.calls.length, 1);
  assert.match(response.calls[0].body.message, /administrator role/i);
});
