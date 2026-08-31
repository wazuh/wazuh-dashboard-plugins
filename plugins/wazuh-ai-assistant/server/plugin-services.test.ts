import assert from 'node:assert/strict';
import { isSettingsReadOnly, setSettingsReadOnly } from './plugin-services';

/**
 * `isSettingsReadOnly`/`setSettingsReadOnly` is the getter/setter singleton
 * `server/routes/settings.ts`'s `requireSettingsUnlocked` reads to decide whether
 * `wazuh_ai_assistant.settingsReadOnly` locks settings/provider writes — the same
 * plugin-wide-singleton shape `getApiKeyCipher`/`setApiKeyCipher` already uses. These cases prove
 * the safe default (`false`) and that the setter is what routes would observe.
 */

afterEach(() => {
  setSettingsReadOnly(false);
});

test('defaults to false (not locked)', () => {
  assert.equal(isSettingsReadOnly(), false);
});

test('setSettingsReadOnly(true) is observed by isSettingsReadOnly()', () => {
  setSettingsReadOnly(true);
  assert.equal(isSettingsReadOnly(), true);
});

test('setSettingsReadOnly(false) flips it back', () => {
  setSettingsReadOnly(true);
  setSettingsReadOnly(false);
  assert.equal(isSettingsReadOnly(), false);
});
