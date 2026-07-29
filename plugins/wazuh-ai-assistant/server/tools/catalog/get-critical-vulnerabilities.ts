import { ToolDefinition } from '../types';
import {
  clampLimit,
  limitProperty,
  objectSchema,
  VULN_DIGEST_SAMPLE_COLUMNS,
  VULN_SOURCE_FIELDS,
} from './common';

/**
 * Ported from GET_CRITICAL_VULNERABILITIES: the `wazuh-states-vulnerabilities` states index
 * holds current vulnerability state (not a time series), so — matching the 4.14 behavior —
 * this tool has no time-range params, only a severity filter and a limited `_source`.
 */
export const getCriticalVulnerabilitiesTool: ToolDefinition = {
  spec: {
    name: 'get_critical_vulnerabilities',
    description:
      'Lists active critical-severity vulnerabilities and the agents affected by them.',
    parameters: objectSchema({
      limit: limitProperty(
        'Max number of vulnerabilities to return (default 20, max 500).',
      ),
    }),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const limit = clampLimit(params.limit, 20, 500);
    return {
      target: 'indexer',
      index: 'wazuh-states-vulnerabilities*',
      body: {
        query: {
          bool: {
            filter: [{ match: { 'vulnerability.severity': 'Critical' } }],
          },
        },
        _source: VULN_SOURCE_FIELDS,
        sort: ['_doc'],
        size: limit,
      },
    };
  },
  tableSpec: {
    columns: [
      { field: 'wazuh.agent.name', label: 'Agent' },
      { field: 'vulnerability.id', label: 'CVE' },
      { field: 'vulnerability.severity', label: 'Severity', severity: true },
      { field: 'package.name', label: 'Package' },
      { field: 'package.version', label: 'Version' },
      { field: 'package.architecture', label: 'Architecture' },
      { field: 'vulnerability.score.base', label: 'CVSS Score' },
      { field: 'vulnerability.description', label: 'Description' },
    ],
  },
  digest: { sampleColumns: VULN_DIGEST_SAMPLE_COLUMNS },
};
