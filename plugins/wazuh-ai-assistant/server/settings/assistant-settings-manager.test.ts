import assert from 'node:assert/strict';
import { AssistantSettingsManager } from './assistant-settings-manager';
import {
  AssistantSettingsAttributes,
  AssistantSettingsProvider,
} from './types';

/**
 * Exercises the manager against two toy providers shaped like the real split (an "index" one
 * owning privacy/fieldPolicy, an "ism" one owning conversationRetentionDays), without touching
 * OpenSearch at all — the partition/merge logic under test is pure orchestration. Each fake owns
 * its own `defaults`, same as the real providers (`IndexSettingsProvider`/`IsmSettingsProvider`),
 * so the manager itself never needs (or is given) a combined defaults object.
 */

type PrivacyFields =
  | 'privacyDefaultOn'
  | 'privacyDefaultPerProvider'
  | 'userCanOverride'
  | 'fieldPolicy';

const INDEX_DEFAULTS: Pick<AssistantSettingsAttributes, PrivacyFields> = {
  privacyDefaultOn: false,
  privacyDefaultPerProvider: {},
  userCanOverride: true,
  fieldPolicy: [],
};

const ISM_DEFAULTS: Pick<
  AssistantSettingsAttributes,
  'conversationRetentionDays'
> = {
  conversationRetentionDays: 0,
};

const COMBINED_DEFAULTS: AssistantSettingsAttributes = {
  ...INDEX_DEFAULTS,
  ...ISM_DEFAULTS,
};

function fakeIndexProvider(
  stored: Pick<AssistantSettingsAttributes, PrivacyFields> | undefined,
): AssistantSettingsProvider<PrivacyFields> & { updateCalls: unknown[] } {
  const updateCalls: unknown[] = [];
  return {
    fields: [
      'privacyDefaultOn',
      'privacyDefaultPerProvider',
      'userCanOverride',
      'fieldPolicy',
    ],
    defaults: INDEX_DEFAULTS,
    updateCalls,
    getSettings() {
      return Promise.resolve(stored);
    },
    createDefaults() {
      return Promise.resolve(INDEX_DEFAULTS);
    },
    updateSettings(_context, attributes) {
      updateCalls.push(attributes);
      return Promise.resolve(attributes);
    },
  };
}

function fakeIsmProvider(
  stored:
    | Pick<AssistantSettingsAttributes, 'conversationRetentionDays'>
    | undefined,
): AssistantSettingsProvider<'conversationRetentionDays'> {
  return {
    fields: ['conversationRetentionDays'],
    defaults: ISM_DEFAULTS,
    getSettings() {
      return Promise.resolve(stored);
    },
    createDefaults() {
      return Promise.resolve(ISM_DEFAULTS);
    },
    updateSettings(_context, attributes) {
      // Simulate a provider that reports back something other than a plain echo.
      return Promise.resolve({
        conversationRetentionDays: attributes.conversationRetentionDays,
      });
    },
  };
}

const noContext = {} as Parameters<
  AssistantSettingsManager['getOrCreateSettings']
>[0];

test('getOrCreateSettings: merges every provider slice into the full attributes object', async () => {
  const manager = new AssistantSettingsManager();
  manager.registerProvider(
    fakeIndexProvider({
      privacyDefaultOn: true,
      privacyDefaultPerProvider: { p1: true },
      userCanOverride: false,
      fieldPolicy: [],
    }),
  );
  manager.registerProvider(fakeIsmProvider({ conversationRetentionDays: 14 }));

  const settings = await manager.getOrCreateSettings(noContext);

  assert.deepEqual(settings, {
    privacyDefaultOn: true,
    privacyDefaultPerProvider: { p1: true },
    userCanOverride: false,
    fieldPolicy: [],
    conversationRetentionDays: 14,
  });
});

test('getOrCreateSettings: bootstraps a provider that reports undefined via its own createDefaults', async () => {
  const manager = new AssistantSettingsManager();
  manager.registerProvider(fakeIndexProvider(undefined));
  manager.registerProvider(fakeIsmProvider(undefined));

  const settings = await manager.getOrCreateSettings(noContext);

  assert.deepEqual(settings, COMBINED_DEFAULTS);
});

test('getOrCreateSettings: default-fills only the individual fields missing from a found slice', async () => {
  const manager = new AssistantSettingsManager();
  manager.registerProvider(
    fakeIndexProvider({
      privacyDefaultOn: true,
      // userCanOverride and fieldPolicy simulate a legacy document missing these keys.
    } as unknown as Pick<AssistantSettingsAttributes, PrivacyFields>),
  );
  manager.registerProvider(fakeIsmProvider({ conversationRetentionDays: 0 }));

  const settings = await manager.getOrCreateSettings(noContext);

  assert.equal(settings.privacyDefaultOn, true);
  assert.equal(settings.userCanOverride, INDEX_DEFAULTS.userCanOverride);
  assert.deepEqual(settings.fieldPolicy, INDEX_DEFAULTS.fieldPolicy);
});

test('updateSettings: routes only each provider its own fields, and merges the results', async () => {
  const manager = new AssistantSettingsManager();
  const indexProvider = fakeIndexProvider(undefined);
  manager.registerProvider(indexProvider);
  manager.registerProvider(fakeIsmProvider(undefined));

  const requested: AssistantSettingsAttributes = {
    ...COMBINED_DEFAULTS,
    privacyDefaultOn: true,
    conversationRetentionDays: 30,
  };

  const result = await manager.updateSettings(noContext, requested);

  assert.deepEqual(result, requested);
  assert.equal(indexProvider.updateCalls.length, 1);
  assert.deepEqual(indexProvider.updateCalls[0], {
    privacyDefaultOn: true,
    privacyDefaultPerProvider: {},
    userCanOverride: true,
    fieldPolicy: [],
  });
});
