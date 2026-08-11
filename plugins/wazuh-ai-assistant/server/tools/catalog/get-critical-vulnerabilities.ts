import { ToolDefinition } from '../types';
import {
  clampLimit,
  limitProperty,
  objectSchema,
  VULN_CURRENT_STATE_NOTE,
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
      'Lists active critical-severity vulnerabilities and the agents (hosts/machines) affected ' +
      `by them. ${VULN_CURRENT_STATE_NOTE}`,
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
      // Column order (issue #8921's budget item): identical treatment to its three siblings
      // (get-vulnerabilities.ts et al.) — this is the 4th tool with the same 8-column set, and
      // leaving it un-reordered would show Architecture in the visible 6 while hiding Description
      // and CVSS, the exact ordering the sibling files' comments argue against.
      { field: 'wazuh.agent.name', label: 'Agent' },
      { field: 'vulnerability.id', label: 'CVE' },
      { field: 'vulnerability.severity', label: 'Severity', severity: true },
      { field: 'package.name', label: 'Package' },
      { field: 'package.version', label: 'Version' },
      { field: 'vulnerability.description', label: 'Description' },
      { field: 'package.architecture', label: 'Architecture' },
      { field: 'vulnerability.score.base', label: 'CVSS Score' },
    ],
  },
  digest: { sampleColumns: VULN_DIGEST_SAMPLE_COLUMNS },
};
