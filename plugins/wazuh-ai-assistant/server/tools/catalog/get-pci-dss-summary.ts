import { ToolDefinition } from '../types';
import {
  clampLimit,
  limitProperty,
  objectSchema,
  resolveTimeRange,
  timeRangeProperties,
} from './common';

/**
 * Same filter as `get_pci_dss_findings.ts` (an `exists` filter on `wazuh.rule.compliance.pci_dss`),
 * aggregated by the specific requirement tag via a `terms` agg directly on
 * `wazuh.rule.compliance.pci_dss` — its values ARE the requirement ids, so no `include` regex is
 * needed to narrow the buckets. `wazuh.rule.compliance.pci_dss` is already on the guardrail agg
 * allowlist (`guardrails.ts`).
 */
export const getPciDssSummaryTool: ToolDefinition = {
  spec: {
    name: 'get_pci_dss_summary',
    description:
      'Aggregates PCI DSS compliance findings within a time range, grouped by the specific PCI DSS ' +
      'requirement tag (e.g. pci_dss_10.2.5). Use for "summarize PCI DSS compliance" questions, ' +
      'not for a list of individual findings.',
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
              { exists: { field: 'wazuh.rule.compliance.pci_dss' } },
              { range: { '@timestamp': { gte, lte } } },
            ],
          },
        },
        aggs: {
          pci_requirements: {
            terms: { field: 'wazuh.rule.compliance.pci_dss', size: limit },
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
