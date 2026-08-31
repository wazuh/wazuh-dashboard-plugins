import assert from 'node:assert/strict';
import { requireSettingsUnlocked, SETTINGS_LOCKED_MESSAGE } from './settings';
import { setSettingsReadOnly } from '../plugin-services';

/**
 * The lock gate `requireSettingsUnlocked` runs first, before any other check, in every
 * settings/provider WRITE handler in server/routes/settings.ts: when
 * `wazuh_ai_assistant.settingsReadOnly` is set, it refuses with HTTP 403 before the request
 * reaches the indexer, regardless of the caller's own indexer RBAC. These cases prove the gate
 * refuses when locked, admits when not, and never touches the response object it wasn't given a
 * reason to call.
 *
 * Runs under the platform Jest runner only: server/routes/settings.ts imports `@osd/config-schema`
 * as a runtime value (`schema.object(...)`, not just types), which resolves only inside a full
 * wazuh-dashboard checkout.
 *
 * Same convention as provider-encryption-gate.test.ts: no request/response-mocking harness exists
 * for OpenSearch Dashboards routes in this plugin, so this exercises the gating helper directly
 * with a `response.forbidden` recorder, using `Parameters<typeof requireSettingsUnlocked>` to pick
 * up the real OSD parameter type without importing it from the (here, unavailable)
 * `../../../../src/core/server` tree. The lock is installed through the SAME plugin-services
 * singleton the real routes read (`isSettingsReadOnly()`), via `setSettingsReadOnly`.
 */

type ResponseFactory = Parameters<typeof requireSettingsUnlocked>[0];

/** Minimal `response` stub: `requireSettingsUnlocked` only ever calls `response.forbidden`.
 * Records every call so tests can assert on exactly what would be sent to the client. */
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

// Every test installs its own lock state; restore the module default (unlocked) afterwards so no
// other test file inherits a locked state from this one.
afterEach(() => {
  setSettingsReadOnly(false);
});

test('refuses with 403 + SETTINGS_LOCKED_MESSAGE when settingsReadOnly is true', () => {
  setSettingsReadOnly(true);
  const { calls, factory } = fakeResponse();

  const result = requireSettingsUnlocked(factory);

  assert.ok(result, 'the gate must return a response, not null');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].body.message, SETTINGS_LOCKED_MESSAGE);
});

test('admits (returns null) when settingsReadOnly is false', () => {
  setSettingsReadOnly(false);
  const { calls, factory } = fakeResponse();

  assert.equal(requireSettingsUnlocked(factory), null);
  assert.equal(calls.length, 0, 'no error response may be built');
});

test('the 403 message tells the caller who to contact and never references repo files', () => {
  assert.match(SETTINGS_LOCKED_MESSAGE, /administrator/i);
  assert.doesNotMatch(SETTINGS_LOCKED_MESSAGE, /docs\/|server\/|\.ts\b/);
});
