import assert from 'node:assert/strict';
import {
  WAZUH_FIELD,
  RETIRED_FIELD_MAP,
  mapRetiredField,
  LEGACY_4X_FIELDS,
  SEVERITY_LEVELS,
} from './wazuh-fields';

test('WAZUH_FIELD exposes the live wazuh.* rule/agent/integration paths', () => {
  assert.equal(WAZUH_FIELD.RULE_LEVEL, 'wazuh.rule.level');
  assert.equal(WAZUH_FIELD.RULE_ID, 'wazuh.rule.id');
  assert.equal(WAZUH_FIELD.RULE_DESCRIPTION, 'wazuh.rule.description');
  assert.equal(WAZUH_FIELD.RULE_TAGS, 'wazuh.rule.tags');
  assert.equal(WAZUH_FIELD.RULE_CATEGORY, 'wazuh.rule.category');
  assert.equal(
    WAZUH_FIELD.RULE_MITRE_TECHNIQUE_ID,
    'wazuh.rule.mitre.technique.id',
  );
  assert.equal(
    WAZUH_FIELD.RULE_MITRE_TECHNIQUE_NAME,
    'wazuh.rule.mitre.technique.name',
  );
  assert.equal(
    WAZUH_FIELD.RULE_COMPLIANCE_PCI_DSS,
    'wazuh.rule.compliance.pci_dss',
  );
  assert.equal(WAZUH_FIELD.INTEGRATION_NAME, 'wazuh.integration.name');
  assert.equal(WAZUH_FIELD.INTEGRATION_CATEGORY, 'wazuh.integration.category');
  assert.equal(WAZUH_FIELD.INTEGRATION_DECODERS, 'wazuh.integration.decoders');
  assert.equal(WAZUH_FIELD.INTEGRATION_RULES, 'wazuh.integration.rules');
});

test('WAZUH_FIELD agent paths use the real 5.0 host subtree, NOT a naive prefix', () => {
  // These are the documented irregulars: agent.os.name / agent.ip do NOT become
  // wazuh.agent.os.name / wazuh.agent.ip.
  assert.equal(WAZUH_FIELD.AGENT_OS_NAME, 'wazuh.agent.host.os.name');
  assert.equal(WAZUH_FIELD.AGENT_IP, 'wazuh.agent.host.ip');
  // Regular (mirrored) agent fields DO follow the plain prefix.
  assert.equal(WAZUH_FIELD.AGENT_ID, 'wazuh.agent.id');
  assert.equal(WAZUH_FIELD.AGENT_NAME, 'wazuh.agent.name');
});

test('WAZUH_FIELD is frozen', () => {
  assert.throws(() => {
    (WAZUH_FIELD as Record<string, string>).RULE_LEVEL = 'mutated';
  });
});

describe('mapRetiredField', () => {
  test('renames a mirrored rule.* field via the exact-match table', () => {
    assert.deepEqual(mapRetiredField('rule.level'), {
      status: 'renamed',
      field: 'wazuh.rule.level',
    });
    assert.deepEqual(mapRetiredField('rule.id'), {
      status: 'renamed',
      field: 'wazuh.rule.id',
    });
  });

  test('renames the agent.os.name / agent.ip irregulars to their real 5.0 homes', () => {
    assert.deepEqual(mapRetiredField('agent.os.name'), {
      status: 'renamed',
      field: 'wazuh.agent.host.os.name',
    });
    assert.deepEqual(mapRetiredField('agent.ip'), {
      status: 'renamed',
      field: 'wazuh.agent.host.ip',
    });
  });

  test('does NOT apply a naive agent. -> wazuh.agent. prefix to the irregulars', () => {
    const osName = mapRetiredField('agent.os.name');
    assert.notEqual(osName.field, 'wazuh.agent.os.name');
    const ip = mapRetiredField('agent.ip');
    assert.notEqual(ip.field, 'wazuh.agent.ip');
  });

  test('renames a regular (non-irregular) agent.* field via the prefix fallback', () => {
    // agent.groups is not in the explicit table, but follows the mirrored prefix rule.
    assert.deepEqual(mapRetiredField('agent.groups'), {
      status: 'renamed',
      field: 'wazuh.agent.groups',
    });
  });

  test('reports a genuinely retired field (no 5.0 equivalent) with status retired', () => {
    assert.deepEqual(mapRetiredField('rule.groups'), {
      status: 'retired',
      field: 'rule.groups',
    });
    assert.deepEqual(mapRetiredField('full_log'), {
      status: 'retired',
      field: 'full_log',
    });
    assert.deepEqual(mapRetiredField('data.srcip'), {
      status: 'retired',
      field: 'data.srcip',
    });
  });

  test('is idempotent: any wazuh.-prefixed input short-circuits to unchanged', () => {
    assert.deepEqual(mapRetiredField('wazuh.rule.level'), {
      status: 'unchanged',
      field: 'wazuh.rule.level',
    });
    assert.deepEqual(mapRetiredField('wazuh.agent.host.os.name'), {
      status: 'unchanged',
      field: 'wazuh.agent.host.os.name',
    });
    // Running mapRetiredField twice on an already-renamed field is a no-op (fixed point).
    const once = mapRetiredField('rule.level');
    const twice = mapRetiredField(once.field);
    assert.deepEqual(twice, { status: 'unchanged', field: once.field });
  });

  test('leaves an unrelated field completely unchanged', () => {
    assert.deepEqual(mapRetiredField('source.ip'), {
      status: 'unchanged',
      field: 'source.ip',
    });
    assert.deepEqual(mapRetiredField('host.hostname'), {
      status: 'unchanged',
      field: 'host.hostname',
    });
  });

  test('handles the trailing .* prefix-match convention', () => {
    assert.deepEqual(mapRetiredField('GeoLocation.*'), {
      status: 'retired',
      field: 'GeoLocation.*',
    });
    assert.deepEqual(mapRetiredField('rule.level.*'), {
      status: 'renamed',
      field: 'wazuh.rule.level.*',
    });
  });

  test('handles the tool-scoped tool/field convention, mapping only the field segment', () => {
    assert.deepEqual(mapRetiredField('get_active_agents/agent.name'), {
      status: 'renamed',
      field: 'get_active_agents/wazuh.agent.name',
    });
    assert.deepEqual(mapRetiredField('get_active_agents/name'), {
      status: 'unchanged',
      field: 'get_active_agents/name',
    });
  });
});

test('LEGACY_4X_FIELDS enumerates the confirmed-dead 4.x vocabulary', () => {
  for (const field of [
    'data.srcip',
    'data.dstip',
    'data.srcuser',
    'data.dstuser',
    'data.username',
    'data.url',
    'data.command',
    'full_log',
    'predecoder.hostname',
    'predecoder.program_name',
    'GeoLocation.*',
    'syscheck.path',
    'syscheck.event',
    'rule.groups',
    'agent.os.name',
    'rule.mitre.id',
    'rule.mitre.technique',
  ]) {
    assert.equal(
      LEGACY_4X_FIELDS.has(field),
      true,
      `expected ${field} to be in LEGACY_4X_FIELDS`,
    );
  }
  assert.equal(LEGACY_4X_FIELDS.has('wazuh.rule.level'), false);
});

test('SEVERITY_LEVELS is the canonical 5-value vocabulary with informational as its own bucket', () => {
  assert.deepEqual(SEVERITY_LEVELS, [
    'informational',
    'low',
    'medium',
    'high',
    'critical',
  ]);
  // informational must be distinct from low, not folded into it.
  assert.notEqual(SEVERITY_LEVELS[0], SEVERITY_LEVELS[1]);
});

test('RETIRED_FIELD_MAP explicitly lists the agent.os.name / agent.ip irregulars', () => {
  assert.equal(RETIRED_FIELD_MAP['agent.os.name'], 'wazuh.agent.host.os.name');
  assert.equal(RETIRED_FIELD_MAP['agent.ip'], 'wazuh.agent.host.ip');
});
