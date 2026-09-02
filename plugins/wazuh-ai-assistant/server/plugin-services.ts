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

/**
 * Getter/setter singleton for the settings/providers admin lock
 * (`wazuh_ai_assistant.settingsReadOnly`, server/config.ts). Defaults to `false` (not locked) —
 * the same safe-default reasoning as `apiKeyCipher` above: a route handler that somehow runs
 * before plugin.ts's setup() resolves the config observable must never wrongly block a write.
 * plugin.ts's setup() always calls `setSettingsReadOnly` with the real, config-derived value
 * before routes are registered/served.
 */
let settingsReadOnly = false;

export function setSettingsReadOnly(value: boolean): void {
  settingsReadOnly = value;
}

export function isSettingsReadOnly(): boolean {
  return settingsReadOnly;
}

/**
 * Configured out-of-credits override message (`wazuh_ai_assistant.outOfCreditsMessage`).
 * `undefined` until plugin.ts's setup() resolves the config, so a provider call that somehow runs
 * earlier behaves exactly like an unconfigured deployment rather than throwing.
 */
let outOfCreditsMessage: string | undefined;

export function setOutOfCreditsMessage(value: string | undefined): void {
  outOfCreditsMessage = value;
}

export function getOutOfCreditsMessage(): string | undefined {
  return outOfCreditsMessage;
}
