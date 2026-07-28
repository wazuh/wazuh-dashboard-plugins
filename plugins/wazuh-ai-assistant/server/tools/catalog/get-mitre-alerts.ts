import { ToolDefinition } from '../types';
import {
  alertDigestColumns,
  alertRowFields,
  clampLimit,
  limitProperty,
  objectSchema,
  optionalStringParam,
  resolveTimeRange,
  timeRangeProperties,
} from './common';

/**
 * NEW module (MITRE ATT&CK). Verified against the wazuh-dashboard-plugins clone (v4.14.6):
 * MITRE-tagged alerts were detected via an `exists` filter on the retired 4.14 rule.mitre.id field
 * (`plugins/main/public/components/common/data-source/pattern/alerts/mitre-attack/
 * mitre-attack-data-source.ts:8,23-34`), with the retired 4.14 rule.mitre.technique/rule.mitre.tactic
 * fields as sibling display columns (`plugins/main/public/components/overview/mitre/events/
 * mitre-attack-columns.tsx:8,12`). All three confirmed `keyword`-mapped arrays in
 * `plugins/main/public/utils/known-fields/alerts.json:730-752`. `technique_id` narrows to one
 * exact technique; omitted, the tool falls back to the `exists` filter for "any MITRE-tagged
 * alert".
 * 5.0: retargeted to wazuh-findings-v5*; the retired 4.14 rule.mitre.id field has no 5.0
 * equivalent and is replaced by `wazuh.rule.mitre.technique.id` (used for both the `exists`
 * filter and the exact-technique `term` match), the retired 4.14 `rule.mitre.technique` field is
 * replaced by `wazuh.rule.mitre.technique.name`, and the retired 4.14 rule.mitre.tactic field is
 * replaced by `wazuh.rule.mitre.tactic.name`.
 */
export const getMitreAlertsTool: ToolDefinition = {
  spec: {
    name: 'get_mitre_alerts',
    description:
      'Searches security findings for findings mapped to MITRE ATT&CK techniques, within a time ' +
      'range, most recent first. Optional technique_id (e.g. "T1110") narrows to one exact ' +
      'technique; omit it to list any MITRE-tagged alert.',
    parameters: objectSchema({
      technique_id: {
        type: 'string',
        description: 'Optional exact MITRE technique ID, e.g. "T1110".',
      },
      limit: limitProperty(
        'Max number of alerts to return (default 20, max 500).',
      ),
      ...timeRangeProperties(),
    }),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const limit = clampLimit(params.limit, 20, 500);
    const { gte, lte } = resolveTimeRange(params);
    const techniqueId = optionalStringParam(params.technique_id);
    const mitreFilter = techniqueId
      ? { term: { 'wazuh.rule.mitre.technique.id': techniqueId } }
      : { exists: { field: 'wazuh.rule.mitre.technique.id' } };
    return {
      target: 'indexer',
      index: 'wazuh-findings-v5*',
      body: {
        query: {
          bool: {
            filter: [mitreFilter, { range: { '@timestamp': { gte, lte } } }],
          },
        },
        sort: [{ '@timestamp': { order: 'desc' } }],
        size: limit,
      },
    };
  },
  tableSpec: {
    columns: [
      { field: '@timestamp', label: 'Time' },
      { field: 'wazuh.agent.name', label: 'Agent' },
      { field: 'wazuh.rule.description', label: 'Description' },
      { field: 'wazuh.rule.mitre.technique.id', label: 'Technique ID' },
      { field: 'wazuh.rule.mitre.technique.name', label: 'Technique' },
      { field: 'wazuh.rule.mitre.tactic.name', label: 'Tactic' },
      { field: 'wazuh.rule.level', label: 'Level', severity: true },
    ],
    // Same alert-hits investigation row set as the other alert tools
    // (server/tools/catalog/common.ts). `wazuh.rule.mitre.technique.id` is already a visible column
    // above, so `alertRowFields` filters it back out — no duplicate row key.
    rowFields: alertRowFields([
      '@timestamp',
      'wazuh.agent.name',
      'wazuh.rule.description',
      'wazuh.rule.mitre.technique.id',
      'wazuh.rule.mitre.technique.name',
      'wazuh.rule.mitre.tactic.name',
      'wazuh.rule.level',
    ]),
  },
  digest: {
    // `wazuh.rule.mitre.tactic.name` is included — it is what the
    // official Wazuh MITRE dashboard surfaces by default — alongside the shared alert-hits extras.
    sampleColumns: alertDigestColumns([
      '@timestamp',
      'wazuh.agent.name',
      'wazuh.rule.mitre.technique.id',
      'wazuh.rule.mitre.technique.name',
      'wazuh.rule.mitre.tactic.name',
    ]),
  },
};
