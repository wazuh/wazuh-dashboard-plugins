import assert from 'node:assert/strict';
import {
  requireApiKeyEncryption,
  ENCRYPTION_REQUIRED_MESSAGE,
} from './settings';
import { ApiKeyCipher, parseEncryptionKey } from '../crypto/api-key-cipher';
import { setApiKeyCipher } from '../plugin-services';

/**
 * The encryption gate `requireApiKeyEncryption` runs in POST /providers and PUT /providers/{id}
 * (server/routes/settings.ts) before any saved-object write: a non-empty `apiKey` is refused with
 * HTTP 503 unless the encryption-at-rest cipher is enabled, so a provider API key can never be
 * stored in plain text (see docs/ENCRYPTION.md). These cases prove the gate refuses a key without
 * encryption, admits one with it, and never fires for credential-less providers.
 *
 * Runs under the platform Jest runner only: server/routes/settings.ts imports `@osd/config-schema`
 * as a runtime value (`schema.object(...)`, not just types), which resolves only inside a full
 * wazuh-dashboard checkout.
 *
 * Same convention as provider-admin-gate.test.ts: no request/response-mocking harness exists for
 * OpenSearch Dashboards routes in this plugin, so this exercises the gating helper directly with
 * a `response.customError` recorder, using `Parameters<typeof requireApiKeyEncryption>` to pick up
 * the real OSD parameter types without importing them from the (here, unavailable)
 * `../../../../src/core/server` tree. The cipher is installed through the SAME
 * plugin-services singleton the real routes read (`getApiKeyCipher()`), via `setApiKeyCipher`.
 */

type ResponseFactory = Parameters<typeof requireApiKeyEncryption>[1];

// A valid base64-encoded 32-byte key, as `wazuh_ai_assistant.encryptionKey` would supply it.
const KEY_B64 = Buffer.from('a'.repeat(32), 'utf8').toString('base64');

/** Minimal `response` stub: `requireApiKeyEncryption` only ever calls `response.customError`.
 * Records every call so tests can assert on exactly what would be sent to the client. */
function fakeResponse(): {
  calls: Array<{ statusCode: number; body: { message: string } }>;
  factory: ResponseFactory;
} {
  const calls: Array<{ statusCode: number; body: { message: string } }> = [];
  const factory = {
    customError(options: { statusCode: number; body: { message: string } }) {
      calls.push(options);
      return { status: options.statusCode, ...options };
    },
  } as unknown as ResponseFactory;
  return { calls, factory };
}

// Every test installs its own cipher; restore the module default (disabled) afterwards so no
// other test file inherits an enabled cipher from this one.
afterEach(() => {
  setApiKeyCipher(new ApiKeyCipher(undefined));
});

test('refuses a non-empty apiKey with 503 + ENCRYPTION_REQUIRED_MESSAGE when encryption is disabled', () => {
  setApiKeyCipher(new ApiKeyCipher(undefined));
  const { calls, factory } = fakeResponse();

  const result = requireApiKeyEncryption('sk-secret-key', factory);

  assert.ok(result, 'the gate must return a response, not null');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].statusCode, 503);
  assert.equal(calls[0].body.message, ENCRYPTION_REQUIRED_MESSAGE);
});

test('admits a non-empty apiKey (returns null) when encryption is enabled', () => {
  setApiKeyCipher(new ApiKeyCipher(parseEncryptionKey(KEY_B64)));
  const { calls, factory } = fakeResponse();

  assert.equal(requireApiKeyEncryption('sk-secret-key', factory), null);
  assert.equal(calls.length, 0, 'no error response may be built');
});

test('never fires for credential-less providers: absent or empty apiKey passes with encryption disabled', () => {
  setApiKeyCipher(new ApiKeyCipher(undefined));
  const { calls, factory } = fakeResponse();

  assert.equal(requireApiKeyEncryption(undefined, factory), null);
  assert.equal(requireApiKeyEncryption('', factory), null);
  assert.equal(calls.length, 0, 'no error response may be built');
});

test('the 503 message tells the operator what to DO and never references repo files', () => {
  // The message is what a direct API caller sees; it must carry the full remediation
  // (key generation, both storage options, restart) without pointing at source files.
  assert.match(ENCRYPTION_REQUIRED_MESSAGE, /openssl rand -base64 32/);
  assert.match(
    ENCRYPTION_REQUIRED_MESSAGE,
    /wazuh_ai_assistant\.encryptionKey/,
  );
  assert.match(ENCRYPTION_REQUIRED_MESSAGE, /opensearch-dashboards-keystore/);
  assert.match(ENCRYPTION_REQUIRED_MESSAGE, /opensearch_dashboards\.yml/);
  assert.doesNotMatch(ENCRYPTION_REQUIRED_MESSAGE, /docs\/|server\/|\.ts\b/);
});
