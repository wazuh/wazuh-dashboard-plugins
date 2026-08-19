import assert from 'node:assert/strict';
import { GENERIC_QUERY_FAMILIES, GENERIC_QUERY_INDEX_PATTERNS } from './generic-query-families';
import { checkIndexAllowlist } from '../guardrails';

// Regression guard for the single-source-of-truth claim this file's own doc comment makes: every
// pattern offered to the model through search_wazuh_data's enum must actually be something
// checkIndexAllowlist accepts, or the model would be offered a family it can never successfully
// query -- the exact "widen it in the enum, forget to widen the guardrail" (or vice versa) drift
// this module exists to prevent.
test('every GENERIC_QUERY_FAMILIES pattern is accepted by checkIndexAllowlist', () => {
  for (const family of GENERIC_QUERY_FAMILIES) {
    const result = checkIndexAllowlist(family.pattern);
    assert.equal(
      result.ok,
      true,
      `pattern "${family.pattern}" is in GENERIC_QUERY_FAMILIES but rejected by checkIndexAllowlist`,
    );
  }
});

test('GENERIC_QUERY_INDEX_PATTERNS mirrors GENERIC_QUERY_FAMILIES 1:1, in order', () => {
  assert.deepEqual(
    GENERIC_QUERY_INDEX_PATTERNS,
    GENERIC_QUERY_FAMILIES.map(family => family.pattern),
  );
});

test('no duplicate index patterns', () => {
  assert.equal(
    new Set(GENERIC_QUERY_INDEX_PATTERNS).size,
    GENERIC_QUERY_INDEX_PATTERNS.length,
  );
});

test('the three original (pre-A1a) families are still present, unchanged', () => {
  assert.ok(GENERIC_QUERY_INDEX_PATTERNS.includes('wazuh-findings-v5-*'));
  assert.ok(GENERIC_QUERY_INDEX_PATTERNS.includes('wazuh-events-v5-*'));
  assert.ok(GENERIC_QUERY_INDEX_PATTERNS.includes('wazuh-states-*'));
});

test('workstream A1a families are present', () => {
  for (const pattern of [
    'wazuh-metrics-*',
    '.wazuh-cti-consumers',
    '.wazuh-content-manager-jobs',
    '.opensearch-sap-*-findings',
    '.opensearch-sap-pre-packaged-rules-config',
    '.opensearch-sap-correlation-metadata',
    '.wazuh-threatintel-vulnerabilities-a',
    'wazuh-threatintel-enrichments-a',
  ]) {
    assert.ok(
      GENERIC_QUERY_INDEX_PATTERNS.includes(pattern),
      `expected "${pattern}" in GENERIC_QUERY_INDEX_PATTERNS`,
    );
  }
});

test('excluded surfaces are NOT present (decline-tier / open product gaps / privacy)', () => {
  for (const pattern of [
    '.opendistro-ism-config',
    'wazuh-ai-assistant-sessions',
    '.opendistro_security',
    '.opensearch-sap-detectors-config', // already covered by get_detectors, not re-listed here
    '.opendistro-alerting-config',
    '.opensearch-notifications-config',
  ]) {
    assert.ok(
      !GENERIC_QUERY_INDEX_PATTERNS.includes(pattern),
      `did not expect "${pattern}" in GENERIC_QUERY_INDEX_PATTERNS`,
    );
  }
});
