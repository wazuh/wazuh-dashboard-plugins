import assert from 'node:assert/strict';
import { applyPersistedTablePolicy } from './field-policy';

/**
 * Re-applying the policy to STORED history (issue #8821). Only the 'never' half acts here:
 * 'anonymize' values are shown in full on every local surface, including this one — see the module
 * header of field-policy.ts.
 */

test('applyPersistedTablePolicy: drops a column the policy now marks "never"', () => {
  const out = applyPersistedTablePolicy(
    {
      columns: [
        { id: 'wazuh.rule.id', label: 'Rule' },
        { id: 'wazuh.agent.name', label: 'Agent' },
      ],
      rows: [{ 'wazuh.rule.id': '5710', 'wazuh.agent.name': 'web-01.corp' }],
    },
    [{ field: 'wazuh.agent.name', action: 'never' }],
  );
  assert.deepEqual(out.columns, [{ id: 'wazuh.rule.id', label: 'Rule' }]);
  assert.deepEqual(out.rows, [{ 'wazuh.rule.id': '5710' }]);
});

test('applyPersistedTablePolicy: leaves an "anonymize" column as stored', () => {
  const spec = {
    columns: [{ id: 'wazuh.agent.name', label: 'Agent' }],
    rows: [{ 'wazuh.agent.name': 'web-01.corp' }],
  };
  // Same reference: nothing changed, so the message object (and the React re-render) is spared.
  assert.equal(
    applyPersistedTablePolicy(spec, [
      { field: 'wazuh.agent.name', action: 'anonymize' },
    ]),
    spec,
  );
});

test('applyPersistedTablePolicy: is idempotent over its own output', () => {
  const policy = [{ field: 'wazuh.agent.name', action: 'never' as const }];
  const first = applyPersistedTablePolicy(
    {
      columns: [
        { id: 'wazuh.rule.id', label: 'Rule' },
        { id: 'wazuh.agent.name', label: 'Agent' },
      ],
      rows: [{ 'wazuh.rule.id': '5710', 'wazuh.agent.name': 'web-01.corp' }],
    },
    policy,
  );
  assert.equal(applyPersistedTablePolicy(first, policy), first);
});

test('applyPersistedTablePolicy: also drops a row-only investigation field', () => {
  const out = applyPersistedTablePolicy(
    {
      columns: [{ id: 'wazuh.rule.id', label: 'Rule' }],
      rows: [
        { 'wazuh.rule.id': '5710', 'process.command_line': 'powershell -enc' },
      ],
    },
    [{ field: 'process.command_line', action: 'never' }],
  );
  assert.deepEqual(out.rows, [{ 'wazuh.rule.id': '5710' }]);
});

test('applyPersistedTablePolicy: a tool-scoped entry needs the tool name to resolve', () => {
  const spec = {
    columns: [{ id: 'name', label: 'Agent' }],
    rows: [{ name: 'web-01.corp' }],
  };
  const policy = [
    { field: 'get_active_agents/name', action: 'never' as const },
  ];
  // No tool name: the scoped entry cannot resolve, so the column survives (documented limitation).
  assert.equal(applyPersistedTablePolicy(spec, policy), spec);
  const scoped = applyPersistedTablePolicy(spec, policy, 'get_active_agents');
  assert.deepEqual(scoped.columns, []);
  assert.deepEqual(scoped.rows, [{}]);
});
