import assert from 'node:assert/strict';
import {
  getOutOfCreditsMessage,
  isSettingsReadOnly,
  setOutOfCreditsMessage,
  setSettingsReadOnly,
} from './plugin-services';

/**
 * `isSettingsReadOnly`/`setSettingsReadOnly` is the getter/setter singleton
 * `server/routes/settings.ts`'s `requireSettingsUnlocked` reads to decide whether
 * `wazuh_ai_assistant.settingsReadOnly` locks settings/provider writes — the same
 * plugin-wide-singleton shape `getApiKeyCipher`/`setApiKeyCipher` already uses. These cases prove
 * the safe default (`false`) and that the setter is what routes would observe.
 */

afterEach(() => {
  setSettingsReadOnly(false);
  setOutOfCreditsMessage(undefined);
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

/**
 * `getOutOfCreditsMessage`/`setOutOfCreditsMessage` is the getter/setter singleton
 * server/providers/retry.ts's `describeOutOfCreditsMessage` reads (reused by
 * server/providers/wazuh-brain.ts) to decide whether an out-of-credits provider failure gets the
 * operator-configured override text instead of the default. Same shape as
 * isSettingsReadOnly/setSettingsReadOnly above; the safe default (`undefined`) is what makes an
 * unconfigured deployment behave exactly as before this setting existed.
 */

test('getOutOfCreditsMessage: defaults to undefined (no override configured)', () => {
  assert.equal(getOutOfCreditsMessage(), undefined);
});

test('getOutOfCreditsMessage: setOutOfCreditsMessage(value) is observed by the getter', () => {
  setOutOfCreditsMessage('Contact your Cloud administrator to add credits.');
  assert.equal(
    getOutOfCreditsMessage(),
    'Contact your Cloud administrator to add credits.',
  );
});

test('getOutOfCreditsMessage: setOutOfCreditsMessage(undefined) clears a previously configured value', () => {
  setOutOfCreditsMessage('Custom message');
  setOutOfCreditsMessage(undefined);
  assert.equal(getOutOfCreditsMessage(), undefined);
});
