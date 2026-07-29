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
  { field: 'wazuh.rule.title', label: 'Title' },
  { field: 'wazuh.rule.level', label: 'Level', severity: true },
  { field: 'wazuh.rule.compliance.pci_dss', label: 'PCI DSS' },
  { field: 'wazuh.rule.id', label: 'Rule ID' },
];
const SAMPLE_COLUMNS = [
  '@timestamp',
  'wazuh.agent.name',
  'wazuh.rule.title',
  'wazuh.rule.level',
];

/**
 * Findings tagged with a PCI DSS compliance requirement, matched with a plain `exists` filter on
 * `wazuh.rule.compliance.pci_dss` (PCI DSS requirement tags such as "pci_dss_10.2.5" live directly
 * on that field, so no wildcard or prefix workaround is needed).
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
              { exists: { field: 'wazuh.rule.compliance.pci_dss' } },
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
