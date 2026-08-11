import { ToolDefinition } from '../types';
import {
  findingDigestColumns,
  findingRowFields,
  clampLimit,
  limitProperty,
  objectSchema,
  optionalStringParam,
  resolveTimeRange,
  timeRangeProperties,
} from './common';

/**
 * MITRE ATT&CK-tagged findings. MITRE-tagged findings are detected via an `exists` filter on
 * `wazuh.rule.mitre.technique.id` (a `keyword`-mapped array), with `wazuh.rule.mitre.technique.name`
 * and `wazuh.rule.mitre.tactic.name` as sibling display columns. `technique_id` narrows to one
 * exact technique via a `term` match on `wazuh.rule.mitre.technique.id`; omitted, the tool falls
 * back to the `exists` filter for "any MITRE-tagged finding".
 */
export const getMitreFindingsTool: ToolDefinition = {
  spec: {
    name: 'get_mitre_findings',
    description:
      'Searches security findings for findings mapped to MITRE ATT&CK techniques, within a time ' +
      'range, most recent first. Optional technique_id (e.g. "T1110") narrows to one exact ' +
      'technique; omit it to list any MITRE-tagged finding.',
    parameters: objectSchema({
      technique_id: {
        type: 'string',
        description: 'Optional exact MITRE technique ID, e.g. "T1110".',
      },
      limit: limitProperty(
        'Max number of findings to return (default 20, max 500).',
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
      // Column order (issue #8921's budget item): the severity badge MUST sit inside the
      // client's MAX_VISIBLE_RESULT_COLUMNS budget — the issue lists "missing severity" as a
      // defect, and a severity column demoted past the budget is invisible (enforced
      // registry-wide by visible-column-budget-coverage.test.ts). Tactic is the column demoted
      // to the row expander: it is derivable from the technique and the least
      // decision-relevant of the seven.
      { field: '@timestamp', label: 'Time' },
      { field: 'wazuh.agent.name', label: 'Agent' },
      { field: 'wazuh.rule.title', label: 'Title' },
      { field: 'wazuh.rule.level', label: 'Level', severity: true },
      { field: 'wazuh.rule.mitre.technique.id', label: 'Technique ID' },
      { field: 'wazuh.rule.mitre.technique.name', label: 'Technique' },
      { field: 'wazuh.rule.mitre.tactic.name', label: 'Tactic' },
    ],
    // Same finding-hits investigation row set as the other finding tools
    // (server/tools/catalog/common.ts). `wazuh.rule.mitre.technique.id` is already a visible column
    // above, so `findingRowFields` filters it back out — no duplicate row key.
    rowFields: findingRowFields([
      '@timestamp',
      'wazuh.agent.name',
      'wazuh.rule.title',
      'wazuh.rule.mitre.technique.id',
      'wazuh.rule.mitre.technique.name',
      'wazuh.rule.mitre.tactic.name',
      'wazuh.rule.level',
    ]),
  },
  digest: {
    // `wazuh.rule.mitre.tactic.name` is included — it is what the
    // official Wazuh MITRE dashboard surfaces by default — alongside the shared finding-hits extras.
    sampleColumns: findingDigestColumns([
      '@timestamp',
      'wazuh.agent.name',
      'wazuh.rule.mitre.technique.id',
      'wazuh.rule.mitre.technique.name',
      'wazuh.rule.mitre.tactic.name',
    ]),
  },
};
