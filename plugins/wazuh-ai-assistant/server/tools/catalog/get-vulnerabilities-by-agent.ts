import { ToolDefinition } from '../types';
import {
  clampLimit,
  limitProperty,
  objectSchema,
  requireNonEmptyString,
  VULN_BREAKDOWN_AGGS,
  VULN_CURRENT_STATE_NOTE,
  VULN_DIGEST_SAMPLE_COLUMNS,
  VULN_SOURCE_FIELDS_WITH_AGENT_ID,
} from './common';

/**
 * Ported from GET_VULNERABILITIES_BY_AGENT: `wazuh-states-vulnerabilities`, `multi_match` across
 * `wazuh.agent.name`/`wazuh.agent.id` so the caller can pass either the agent's human name or its
 * numeric ID (4.14 semantics — same field pair, ECS-renamed in 5.0). No time range: states
 * index, not a time series (same
 * precedent as `get_critical_vulnerabilities`/`get_vulnerabilities`).
 */
export const getVulnerabilitiesByAgentTool: ToolDefinition = {
  spec: {
    name: 'get_vulnerabilities_by_agent',
    description:
      'Lists active vulnerabilities affecting one specific agent (host/machine/endpoint), ' +
      'identified by its name or its numeric agent ID. Use when the question names a particular ' +
      `host/agent, not the whole fleet. ${VULN_CURRENT_STATE_NOTE}`,
    parameters: objectSchema(
      {
        agent_identifier: {
          type: 'string',
          description:
            'Agent name (e.g. "web-prod-01") or numeric agent ID (e.g. "003").',
        },
        limit: limitProperty(
          'Max number of vulnerabilities to return (default 20, max 500).',
        ),
      },
      ['agent_identifier'],
    ),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const agentIdentifier = requireNonEmptyString(
      params.agent_identifier,
      'Parameter "agent_identifier" is required and must be a non-empty string.',
    );
    const limit = clampLimit(params.limit, 20, 500);
    return {
      target: 'indexer',
      index: 'wazuh-states-vulnerabilities*',
      body: {
        query: {
          bool: {
            filter: [
              {
                multi_match: {
                  query: agentIdentifier,
                  fields: ['wazuh.agent.name', 'wazuh.agent.id'],
                },
              },
            ],
          },
        },
        _source: VULN_SOURCE_FIELDS_WITH_AGENT_ID,
        sort: ['_doc'],
        size: limit,
        // Population-true severity/agent breakdown over the FULL matched set (issue #8920 item 1:
        // "no high-severity vulnerabilities" on a host that actually has some, just sorted outside
        // the returned page) -- see VULN_BREAKDOWN_AGGS's doc comment in common.ts.
        aggs: VULN_BREAKDOWN_AGGS,
      },
    };
  },
  tableSpec: {
    columns: [
      { field: 'wazuh.agent.id', label: 'Agent ID' },
      { field: 'wazuh.agent.name', label: 'Agent' },
      { field: 'vulnerability.id', label: 'CVE' },
      { field: 'vulnerability.severity', label: 'Severity', severity: true },
      { field: 'package.name', label: 'Package' },
      { field: 'package.version', label: 'Version' },
      { field: 'package.architecture', label: 'Architecture' },
      { field: 'vulnerability.score.base', label: 'CVSS Score' },
    ],
  },
  digest: { sampleColumns: VULN_DIGEST_SAMPLE_COLUMNS },
};
