import { SavedObjectsServiceStart } from '../../../src/core/server';
import { ApiKeyCipher } from './crypto/api-key-cipher';

/**
 * Tiny start-services holder (the getter/setter singleton pattern the design references from
 * wazuh-check-updates/server/plugin-services.ts). Needed because a route handler's
 * `context.core.savedObjects.client` is the request-scoped client built with NO hidden types on
 * this OSD version (CoreSavedObjectsRouteHandlerContext exposes only `client`/`typeRegistry`, no
 * `getClient(options)`), so the ONLY way to reach a `hidden: true` type (the assistant-settings and
 * provider types — server/routes/settings.ts) is the START contract's `getScopedClient(request,
 * { includedHiddenTypes })`. plugin.ts's start() stashes the service here; those routes read it
 * per request. Persisted conversations don't use this at all any more — they are read/written
 * directly against the `wazuh-ai-assistant-sessions` index alias (server/conversation-store.ts).
 */
let savedObjectsStart: SavedObjectsServiceStart | undefined;

export function setSavedObjectsStart(service: SavedObjectsServiceStart): void {
  savedObjectsStart = service;
}

export function getSavedObjectsStart(): SavedObjectsServiceStart {
  if (!savedObjectsStart) {
    throw new Error(
      'wazuhAiAssistant: savedObjects start service requested before plugin start() ran.',
    );
  }
  return savedObjectsStart;
}

/**
 * Same getter/setter singleton pattern as `savedObjectsStart` above, for the provider-API-key
 * encryption-at-rest cipher (server/crypto/api-key-cipher.ts). Unlike `savedObjectsStart`, the
 * default here is a live, DISABLED `ApiKeyCipher` rather than `undefined` + a
 * throw: route handlers must never crash just because they ran before plugin.ts's setup()
 * resolved the config observable (or in a hypothetical future test harness that never calls
 * `setApiKeyCipher`) — a disabled cipher is a safe, fail-closed default (`enabled === false`
 * gates writes, and its encrypt/decrypt refuse plaintext rather than pass it through).
 * plugin.ts's setup() always calls `setApiKeyCipher` with the real,
 * config-derived cipher before routes are registered/served.
 */
let apiKeyCipher: ApiKeyCipher = new ApiKeyCipher(undefined);

export function setApiKeyCipher(cipher: ApiKeyCipher): void {
  apiKeyCipher = cipher;
}

export function getApiKeyCipher(): ApiKeyCipher {
  return apiKeyCipher;
}
