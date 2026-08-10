import { ApiKeyCipher } from './crypto/api-key-cipher';

/**
 * Getter/setter singleton for the provider-API-key encryption-at-rest cipher
 * (server/crypto/api-key-cipher.ts). The default here is a live, DISABLED `ApiKeyCipher` rather
 * than `undefined` + a throw: route handlers must never crash just because they ran before
 * plugin.ts's setup() resolved the config observable (or in a hypothetical future test harness
 * that never calls `setApiKeyCipher`) — a disabled cipher is a safe, fail-closed default
 * (`enabled === false` gates writes, and its encrypt/decrypt refuse plaintext rather than pass it
 * through). plugin.ts's setup() always calls `setApiKeyCipher` with the real, config-derived
 * cipher before routes are registered/served.
 */
let apiKeyCipher: ApiKeyCipher = new ApiKeyCipher(undefined);

export function setApiKeyCipher(cipher: ApiKeyCipher): void {
  apiKeyCipher = cipher;
}

export function getApiKeyCipher(): ApiKeyCipher {
  return apiKeyCipher;
}
