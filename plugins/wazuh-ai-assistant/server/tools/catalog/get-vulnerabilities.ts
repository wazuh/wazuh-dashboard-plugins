import { ToolDefinition } from '../types';
import {
  clampLimit,
  limitProperty,
  objectSchema,
  optionalStringParam,
  VULN_DIGEST_SAMPLE_COLUMNS,
  VULN_SOURCE_FIELDS,
} from './common';

/**
 * NEW tool (fixes a reported gap: "all the vulnerabilities" previously had no non-critical-only
 * answer). Same index, `_source`, and table shape as `get_critical_vulnerabilities.ts` — the
 * `wazuh-states-vulnerabilities` states index holds current vulnerability state (not a time
 * series), so, matching that tool's precedent, there are no time-range params. `severity` is
 * optional: omit it to list every active vulnerability across the fleet; both tools are kept
 * side by side since a weak router model
 * benefits from an explicit "critical" tool separate from this general one.
 */
export const getVulnerabilitiesTool: ToolDefinition = {
  spec: {
    name: 'get_vulnerabilities',
    description:
      'Lists active vulnerabilities and the agents affected by them, across the whole fleet. ' +
      'Optional severity filter (Critical/High/Medium/Low); omit severity to list ALL ' +
      'vulnerabilities regardless of severity. Use get_critical_vulnerabilities instead if the ' +
      'question is specifically about critical-only vulnerabilities.',
    parameters: objectSchema({
      severity: {
        type: 'string',
        description:
          'Optional severity filter. Omit to return vulnerabilities of any severity.',
        enum: ['Critical', 'High', 'Medium', 'Low'],
      },
      limit: limitProperty(
        'Max number of vulnerabilities to return (default 20, max 500).',
      ),
    }),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const limit = clampLimit(params.limit, 20, 500);
    const severity = optionalStringParam(params.severity);
    const query = severity
      ? {
          bool: { filter: [{ match: { 'vulnerability.severity': severity } }] },
        }
      : { match_all: {} };
    return {
      target: 'indexer',
      index: 'wazuh-states-vulnerabilities*',
      body: {
        query,
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
