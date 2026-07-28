import assert from 'node:assert/strict';
import { normalizeFieldPolicy } from './field-policy-normalizer';
import { FieldPolicyEntry } from './privacy';

test('normalizeFieldPolicy: pure old-vocabulary input is renamed to wazuh.*', () => {
  const input: FieldPolicyEntry[] = [
    { field: 'agent.name', action: 'anonymize' },
    { field: 'rule.id', action: 'allow' },
  ];
  const out = normalizeFieldPolicy(input);
  assert.deepEqual(out.map(e => e.field).sort(), [
    'wazuh.agent.name',
    'wazuh.rule.id',
  ]);
  const agentEntry = out.find(e => e.field === 'wazuh.agent.name')!;
  assert.equal(agentEntry.action, 'anonymize');
});

test('normalizeFieldPolicy: pure new-vocabulary input is a no-op (already migrated)', () => {
  const input: FieldPolicyEntry[] = [
    { field: 'wazuh.agent.name', action: 'anonymize', kind: 'HOST' },
    { field: 'wazuh.rule.id', action: 'allow' },
  ];
  const out = normalizeFieldPolicy(input);
  assert.deepEqual(out, input);
});

test('normalizeFieldPolicy: mixed old/new input converges to one wazuh.* set', () => {
  const input: FieldPolicyEntry[] = [
    { field: 'agent.id', action: 'allow' },
    { field: 'wazuh.rule.level', action: 'allow' },
    { field: 'rule.level', action: 'allow' },
  ];
  const out = normalizeFieldPolicy(input);
  assert.deepEqual(out.map(e => e.field).sort(), [
    'wazuh.agent.id',
    'wazuh.rule.level',
  ]);
});

test('normalizeFieldPolicy: collision dedupe — strictest action wins (never > anonymize > allow)', () => {
  const input: FieldPolicyEntry[] = [
    { field: 'agent.name', action: 'allow' },
    { field: 'wazuh.agent.name', action: 'never' },
  ];
  const out = normalizeFieldPolicy(input);
  assert.equal(out.length, 1);
  assert.equal(out[0].field, 'wazuh.agent.name');
  assert.equal(out[0].action, 'never');
});

test('normalizeFieldPolicy: collision dedupe is order-independent', () => {
  const input: FieldPolicyEntry[] = [
    { field: 'wazuh.agent.name', action: 'never' },
    { field: 'agent.name', action: 'allow' },
  ];
  const out = normalizeFieldPolicy(input);
  assert.equal(out.length, 1);
  assert.equal(out[0].action, 'never');
});

test('normalizeFieldPolicy: a retired field with "anonymize"/"never" action is kept verbatim', () => {
  const input: FieldPolicyEntry[] = [
    { field: 'data.srcip', action: 'anonymize' },
    { field: 'full_log', action: 'never' },
  ];
  const out = normalizeFieldPolicy(input);
  assert.deepEqual(out.map(e => e.field).sort(), ['data.srcip', 'full_log']);
});

test('normalizeFieldPolicy: a retired field with "allow" action is dropped (dead permissive entry)', () => {
  const input: FieldPolicyEntry[] = [
    { field: 'rule.groups', action: 'allow' },
    { field: 'rule.id', action: 'allow' },
  ];
  const out = normalizeFieldPolicy(input);
  assert.deepEqual(
    out.map(e => e.field),
    ['wazuh.rule.id'],
  );
});

test('normalizeFieldPolicy: an unrecognized/user-added field passes through untouched', () => {
  const input: FieldPolicyEntry[] = [
    {
      field: 'data.win.system.computerName',
      action: 'anonymize',
      kind: 'HOST',
    },
  ];
  const out = normalizeFieldPolicy(input);
  assert.deepEqual(out, input);
});

test('normalizeFieldPolicy: running it twice is idempotent (fixed point)', () => {
  const input: FieldPolicyEntry[] = [
    { field: 'agent.name', action: 'anonymize' },
    { field: 'wazuh.agent.name', action: 'never' },
    { field: 'rule.groups', action: 'allow' },
    { field: 'data.srcip', action: 'anonymize' },
  ];
  const once = normalizeFieldPolicy(input);
  const twice = normalizeFieldPolicy(once);
  assert.deepEqual(twice, once);
});

test('normalizeFieldPolicy: preserves a surviving explicit kind on collision merge', () => {
  const input: FieldPolicyEntry[] = [
    { field: 'agent.name', action: 'anonymize' },
    { field: 'wazuh.agent.name', action: 'never', kind: 'HOST' },
  ];
  const out = normalizeFieldPolicy(input);
  assert.equal(out.length, 1);
  assert.equal(out[0].kind, 'HOST');
});

test('normalizeFieldPolicy: empty input returns empty output', () => {
  assert.deepEqual(normalizeFieldPolicy([]), []);
});
