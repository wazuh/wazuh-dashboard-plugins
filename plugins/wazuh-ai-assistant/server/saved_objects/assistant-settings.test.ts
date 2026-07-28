import assert from 'node:assert/strict';
import {
  SavedObjectMigrationContext,
  SavedObjectUnsanitizedDoc,
} from '../../../../src/core/server';
import {
  assistantSettingsSavedObjectType,
  migrateFieldPolicyTo50,
  AssistantSettingsAttributes,
} from './assistant-settings';
import { FieldPolicyEntry } from '../tools/privacy';

// Minimal shape of what the migration function actually reads/writes; the real
// SavedObjectUnsanitizedDoc carries far more (id, type, references, ...) but this migration only
// ever touches `attributes.fieldPolicy`.
function fakeDoc(
  fieldPolicy: unknown,
): SavedObjectUnsanitizedDoc<Partial<AssistantSettingsAttributes>> {
  return {
    id: 'wazuh-ai-assistant-settings',
    type: 'wazuh-ai-assistant-settings',
    attributes: { fieldPolicy } as Partial<AssistantSettingsAttributes>,
    references: [],
  };
}

// The migration function never reads its second (context) argument, so an empty object is a
// faithful-enough stand-in without pulling in a full OSD migration-context mock.
const fakeContext = {} as SavedObjectMigrationContext;

test('migrateFieldPolicyTo50: renames a mixed old/new pre-upgrade fieldPolicy array', () => {
  const preUpgrade: FieldPolicyEntry[] = [
    { field: 'agent.name', action: 'anonymize' },
    { field: 'wazuh.rule.id', action: 'allow' },
    { field: 'rule.id', action: 'allow' },
    { field: 'full_log', action: 'never' },
  ];
  const migrated = migrateFieldPolicyTo50(fakeDoc(preUpgrade), fakeContext);
  const fieldPolicy = migrated.attributes!.fieldPolicy as FieldPolicyEntry[];
  const fields = fieldPolicy.map(e => e.field).sort();
  assert.deepEqual(fields, ['full_log', 'wazuh.agent.name', 'wazuh.rule.id']);
  const ruleId = fieldPolicy.find(e => e.field === 'wazuh.rule.id')!;
  assert.equal(ruleId.action, 'allow');
});

test('migrateFieldPolicyTo50: running it twice is idempotent', () => {
  const preUpgrade: FieldPolicyEntry[] = [
    { field: 'agent.name', action: 'anonymize' },
    { field: 'wazuh.agent.name', action: 'never' },
  ];
  const once = migrateFieldPolicyTo50(fakeDoc(preUpgrade), fakeContext);
  const twice = migrateFieldPolicyTo50(
    fakeDoc(once.attributes!.fieldPolicy),
    fakeContext,
  );
  assert.deepEqual(twice.attributes!.fieldPolicy, once.attributes!.fieldPolicy);
});

test('migrateFieldPolicyTo50: a document with no fieldPolicy attribute passes through untouched', () => {
  const doc = fakeDoc(undefined);
  const migrated = migrateFieldPolicyTo50(doc, fakeContext);
  assert.deepEqual(migrated, doc);
});

test('migrateFieldPolicyTo50: a document whose fieldPolicy is not an array passes through untouched', () => {
  const doc = fakeDoc('not-an-array');
  const migrated = migrateFieldPolicyTo50(doc, fakeContext);
  assert.deepEqual(migrated, doc);
});

test('assistantSettingsSavedObjectType: registers the 3.6.0 migration', () => {
  assert.ok(assistantSettingsSavedObjectType.migrations);
  const migrations = assistantSettingsSavedObjectType.migrations as Record<
    string,
    unknown
  >;
  assert.equal(migrations['3.6.0'], migrateFieldPolicyTo50);
});
