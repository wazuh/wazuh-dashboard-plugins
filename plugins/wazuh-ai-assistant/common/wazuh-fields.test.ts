import assert from 'node:assert/strict';
import { WAZUH_FIELD, SEVERITY_LEVELS } from './wazuh-fields';

test('WAZUH_FIELD exposes the live wazuh.* rule/agent/integration paths', () => {
  assert.equal(WAZUH_FIELD.RULE_LEVEL, 'wazuh.rule.level');
  assert.equal(WAZUH_FIELD.RULE_ID, 'wazuh.rule.id');
  assert.equal(WAZUH_FIELD.RULE_TITLE, 'wazuh.rule.title');
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
