import { ToolDefinition } from '../types';
import {
  clampLimit,
  limitProperty,
  objectSchema,
  resolveTimeRange,
  timeRangeProperties,
} from './common';

/**
 * Ported from GET_PCI_DSS_SUMMARY: same filter as `get_pci_dss_alerts.ts` (see that file for why
 * an `exists` filter on `rule.compliance.pci_dss` replaces the 4.14 `prefix` workaround),
 * aggregated by the specific requirement tag via a `terms` agg directly on
 * `rule.compliance.pci_dss` — its values ARE the requirement ids in 5.0, so the 4.14 `include`
 * regex narrowing `rule.groups` buckets to `pci_dss_*` is no longer needed. `rule.compliance.pci_dss`
 * is already on the guardrail agg allowlist (`guardrails.ts`).
 * 5.0: retargeted to wazuh-findings-v5*; `rule.groups` is gone.
 */
export const getPciDssSummaryTool: ToolDefinition = {
  spec: {
    name: 'get_pci_dss_summary',
    description:
      'Aggregates PCI DSS compliance alerts within a time range, grouped by the specific PCI DSS ' +
      'requirement tag (e.g. pci_dss_10.2.5). Use for "summarize PCI DSS compliance" questions, ' +
      'not for a list of individual alerts.',
    parameters: objectSchema({
      limit: limitProperty(
        'Max number of PCI DSS requirement buckets to return (default 20, max 100).',
      ),
      ...timeRangeProperties(),
    }),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const limit = clampLimit(params.limit, 20, 100);
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
        aggs: {
          pci_requirements: {
            terms: { field: 'rule.compliance.pci_dss', size: limit },
          },
        },
        size: 0,
      },
    };
  },
  tableSpec: {
    columns: [
      { field: 'key', label: 'PCI DSS requirement' },
      { field: 'doc_count', label: 'Count' },
    ],
  },
  digest: { sampleColumns: ['key', 'doc_count'] },
};
