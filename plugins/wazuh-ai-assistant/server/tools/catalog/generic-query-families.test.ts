import assert from 'node:assert/strict';
import {
  GENERIC_QUERY_FAMILIES,
  GENERIC_QUERY_INDEX_PATTERNS,
} from './generic-query-families';
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

// EXPLAIN-WAVE PHASE 5. `wazuh-states-*` has covered wazuh-states-fim-registry-keys/-values since
// the day it shipped, but its label said only "FIM", which reads as the files surface get_fim_files
// already owns. On eval run 20260825-193632 the model declined two registry questions outright
// (EV2-FIM-002: zero tool calls; EV2-EXP-002: 2.6/10) rather than aim this pattern at the registry
// indices. The enum VALUE is untouched -- that is the wire contract -- but the label now says what
// the pattern has always covered.
test('the wazuh-states-* label names the registry half of FIM, not just files', () => {
  const states = GENERIC_QUERY_FAMILIES.find(
    family => family.pattern === 'wazuh-states-*',
  );
  assert.ok(states, 'wazuh-states-* must remain an offered family');
  assert.match(states.label, /Windows registry/);
  assert.match(states.label, /file state/);
});

test('wazuh-states-fim-registry-* is reachable through the wazuh-states-* family', () => {
  // The concrete indices the label now points at must actually pass the guardrail, or the routing
  // rule the system prompt states would send the model at a query that can never execute.
  for (const index of [
    'wazuh-states-fim-registry-keys',
    'wazuh-states-fim-registry-values',
  ]) {
    assert.equal(checkIndexAllowlist(index).ok, true, index);
  }
  assert.ok(GENERIC_QUERY_INDEX_PATTERNS.includes('wazuh-states-*'));
});
