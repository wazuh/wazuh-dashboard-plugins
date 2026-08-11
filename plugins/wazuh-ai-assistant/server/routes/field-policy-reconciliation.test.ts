import assert from 'node:assert/strict';
import { getOrCreateAssistantSettings } from './settings';
import { setSavedObjectsStart } from '../plugin-services';
import { FIELD_POLICY_DEFAULTS } from '../tools/privacy';
import { AssistantSettingsAttributes } from '../saved_objects/assistant-settings';
import {
  Logger,
  OpenSearchDashboardsRequest,
  SavedObjectsServiceStart,
} from '../../../../src/core/server';

/**
 * Issue #8917: the `wazuh-ai-assistant-settings` singleton's `fieldPolicy` was taken wholesale from
 * the saved object (`found.attributes.fieldPolicy ?? DEFAULT_ASSISTANT_SETTINGS.fieldPolicy`),
 * never reconciled against `FIELD_POLICY_DEFAULTS`, so a policy entry shipped after the object was
 * first written (here: `package.name`/`package.version`) never reached an existing installation --
 * on a fail-closed tool, the missing entry meant wholesale pseudonymization of real values.
 *
 * These cases exercise `getOrCreateAssistantSettings` itself (not just the pure
 * `mergeFieldPolicyWithDefaults` helper covered in server/tools/privacy.test.ts) end to end against
 * a fake saved-objects client, proving: the effective `fieldPolicy` returned to a caller (chat.ts,
 * the GET /settings route) is reconciled; the stored object itself is left untouched by a mere
 * read (no silent rewrite); the visibility mechanism (a server log line, and
 * `fieldPolicyReconciledFields` on the returned object) fires exactly when there is something to
 * report and stays silent otherwise.
 *
 * Runs under the platform Jest runner only: server/routes/settings.ts imports `@osd/config-schema`
 * as a runtime value, which resolves only inside a full wazuh-dashboard checkout (same constraint
 * documented on provider-admin-gate.test.ts and provider-encryption-gate.test.ts in this
 * directory).
 */

const SETTINGS_TYPE = 'wazuh-ai-assistant-settings';
const SETTINGS_ID = 'wazuh-ai-assistant-settings';

/** In-memory fake standing in for the real hidden-type-capable scoped saved-objects client
 * (`assistantSettingsClient` in settings.ts). Only implements the three calls
 * `getOrCreateAssistantSettings` actually makes: `get`, and (on a missing singleton) `create`. */
function fakeSavedObjectsStart(
  initialAttributes: AssistantSettingsAttributes | undefined,
): {
  start: SavedObjectsServiceStart;
  store: { attributes?: AssistantSettingsAttributes };
} {
  const store: { attributes?: AssistantSettingsAttributes } = {
    attributes: initialAttributes,
  };
  const client = {
    get(_type: string, _id: string) {
      if (!store.attributes) {
        return Promise.reject(new Error('not found'));
      }
      return Promise.resolve({
        id: SETTINGS_ID,
        type: SETTINGS_TYPE,
        attributes: store.attributes,
      });
    },
    create(
      _type: string,
      attributes: AssistantSettingsAttributes,
      _options: { id: string },
    ) {
      store.attributes = attributes;
      return Promise.resolve({
        id: SETTINGS_ID,
        type: SETTINGS_TYPE,
        attributes,
      });
    },
    update(
      _type: string,
      _id: string,
      attributes: AssistantSettingsAttributes,
    ) {
      store.attributes = { ...store.attributes, ...attributes };
      return Promise.resolve({
        id: SETTINGS_ID,
        type: SETTINGS_TYPE,
        attributes,
      });
    },
  };
  const start = {
    getScopedClient: () => client,
  } as unknown as SavedObjectsServiceStart;
  return { start, store };
}

/** Records every `warn` call; the other Logger methods are no-ops. */
function fakeLogger(): { logger: Logger; warnings: string[] } {
  const warnings: string[] = [];
  const logger = {
    warn: (message: string) => {
      warnings.push(message);
    },
    debug: () => undefined,
    error: () => undefined,
    info: () => undefined,
  } as unknown as Logger;
  return { logger, warnings };
}

const FAKE_REQUEST = {} as OpenSearchDashboardsRequest;

test('getOrCreateAssistantSettings: a legacy stored policy missing shipped entries is reconciled on read, without rewriting the saved object', async () => {
  const legacyPolicy = FIELD_POLICY_DEFAULTS.filter(
    entry =>
      entry.field !== 'package.name' && entry.field !== 'package.version',
  );
  const { start, store } = fakeSavedObjectsStart({
    privacyDefaultOn: false,
    privacyDefaultPerProvider: {},
    userCanOverride: true,
    fieldPolicy: legacyPolicy,
    // No fieldPolicyKnownFields at all -- exactly the shape of an object written before #8917.
    conversationRetentionDays: 0,
  });
  setSavedObjectsStart(start);
  const { logger, warnings } = fakeLogger();

  const settings = await getOrCreateAssistantSettings(FAKE_REQUEST, logger);

  assert.ok(
    settings.fieldPolicy.some(e => e.field === 'package.name'),
    'the effective policy must include the reconciled package.name entry',
  );
  assert.ok(
    settings.fieldPolicy.some(e => e.field === 'package.version'),
    'the effective policy must include the reconciled package.version entry',
  );
  assert.deepEqual(settings.fieldPolicyReconciledFields.sort(), [
    'package.name',
    'package.version',
  ]);

  // Visibility: a server-log warning was emitted naming exactly the reconciled fields.
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /package\.name/);
  assert.match(warnings[0], /package\.version/);
  assert.match(warnings[0], /predates/);

  // The stored object itself is left exactly as it was -- a read alone never rewrites it (avoids
  // surprise writes/updated_at churn on every chat turn); only an explicit settings save does.
  assert.equal(store.attributes!.fieldPolicy, legacyPolicy);
  assert.equal(store.attributes!.fieldPolicy.length, legacyPolicy.length);
});

test('getOrCreateAssistantSettings: an up-to-date stored policy is returned unchanged and logs nothing', async () => {
  const { start, store } = fakeSavedObjectsStart({
    privacyDefaultOn: false,
    privacyDefaultPerProvider: {},
    userCanOverride: true,
    fieldPolicy: FIELD_POLICY_DEFAULTS,
    fieldPolicyKnownFields: FIELD_POLICY_DEFAULTS.map(e => e.field),
    conversationRetentionDays: 0,
  });
  setSavedObjectsStart(start);
  const { logger, warnings } = fakeLogger();

  const settings = await getOrCreateAssistantSettings(FAKE_REQUEST, logger);

  assert.deepEqual(settings.fieldPolicyReconciledFields, []);
  assert.equal(
    warnings.length,
    0,
    'nothing to reconcile must never log a warning',
  );
  assert.equal(settings.fieldPolicy, store.attributes!.fieldPolicy);
});

test('getOrCreateAssistantSettings: a field the admin deliberately removed stays removed across reads (no logger required)', async () => {
  // The admin previously saved with package.name known (part of what they were editing) but then
  // removed it -- fieldPolicyKnownFields still lists it, fieldPolicy no longer does.
  const stored = FIELD_POLICY_DEFAULTS.filter(e => e.field !== 'package.name');
  const { start } = fakeSavedObjectsStart({
    privacyDefaultOn: false,
    privacyDefaultPerProvider: {},
    userCanOverride: true,
    fieldPolicy: stored,
    fieldPolicyKnownFields: FIELD_POLICY_DEFAULTS.map(e => e.field),
    conversationRetentionDays: 0,
  });
  setSavedObjectsStart(start);

  // No logger passed at all -- callers without one (none exist today, but the parameter is
  // optional) must not throw.
  const settings = await getOrCreateAssistantSettings(FAKE_REQUEST);

  assert.equal(
    settings.fieldPolicy.some(e => e.field === 'package.name'),
    false,
    'a deliberately deleted field must not be resurrected by the reconciliation',
  );
  assert.deepEqual(settings.fieldPolicyReconciledFields, []);
});

test('getOrCreateAssistantSettings: a brand-new install is created with the full shipped policy and nothing to reconcile', async () => {
  const { start, store } = fakeSavedObjectsStart(undefined);
  setSavedObjectsStart(start);
  const { logger, warnings } = fakeLogger();

  const settings = await getOrCreateAssistantSettings(FAKE_REQUEST, logger);

  assert.equal(settings.fieldPolicy.length, FIELD_POLICY_DEFAULTS.length);
  assert.deepEqual(settings.fieldPolicyReconciledFields, []);
  assert.equal(warnings.length, 0);
  assert.ok(store.attributes, 'the singleton must have been created');
});
