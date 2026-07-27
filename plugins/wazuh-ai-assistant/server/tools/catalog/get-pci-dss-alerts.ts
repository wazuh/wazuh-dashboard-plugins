import { ToolDefinition } from '../types';
import {
  alertDigestColumns,
  alertRowFields,
  clampLimit,
  limitProperty,
  objectSchema,
  resolveTimeRange,
  timeRangeProperties,
} from './common';

// rule.compliance.pci_dss is already a visible column here (unlike the other alert-hits tools) —
// passing it below lets alertRowFields/alertDigestColumns dedupe it out of the shared row/digest sets
// instead of assigning the same dot-path twice.
const TABLE_COLUMNS = [
  { field: '@timestamp', label: 'Time' },
  { field: 'wazuh.agent.name', label: 'Agent' },
  { field: 'rule.description', label: 'Description' },
  { field: 'rule.level', label: 'Level', severity: true },
  { field: 'rule.compliance.pci_dss', label: 'PCI DSS' },
  { field: 'rule.id', label: 'Rule ID' },
];
const SAMPLE_COLUMNS = [
  '@timestamp',
  'wazuh.agent.name',
  'rule.description',
  'rule.level',
];

/**
 * Ported from 4.14, which used `rule.groups:*pci_dss*`; `rule.groups`
 * values are specific requirement tags like "pci_dss_10.2.5" (never a bare "pci_dss"), so a
 * `prefix` query on `rule.groups` for "pci_dss" reproduces the same match set without a wildcard.
 * `prefix` is not one of guardrails.ts's `LEADING_WILDCARD_KEYS` (`wildcard`/`query_string`/
 * `simple_query_string`) and is not checked anywhere else in `lintDsl`, so it passes the lint —
 * verified by reading `guardrails.ts` in full (no `prefix` handling exists there).
 * 5.0: retargeted to wazuh-findings-v5*; `rule.groups` is gone, and PCI DSS requirement tags now
 * live directly on `rule.compliance.pci_dss`, so the `prefix` workaround is replaced by a plain
 * `exists` filter on that field.
 */
export const getPciDssAlertsTool: ToolDefinition = {
  spec: {
    name: 'get_pci_dss_alerts',
    description:
      'Searches security findings for findings tagged with any PCI DSS compliance requirement ' +
      '(rule.compliance.pci_dss present), within a time range, most recent first.',
    parameters: objectSchema({
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
    return {
      target: 'indexer',
      index: 'wazuh-findings-v5*',
      body: {
        query: {
          bool: {
            filter: [
              { exists: { field: 'rule.compliance.pci_dss' } },
              { range: { '@timestamp': { gte, lte } } },
            ],
          },
        },
        sort: [{ '@timestamp': { order: 'desc' } }],
        size: limit,
      },
    };
  },
  tableSpec: {
    columns: TABLE_COLUMNS,
    rowFields: alertRowFields(TABLE_COLUMNS.map(column => column.field)),
  },
  digest: { sampleColumns: alertDigestColumns(SAMPLE_COLUMNS) },
};
