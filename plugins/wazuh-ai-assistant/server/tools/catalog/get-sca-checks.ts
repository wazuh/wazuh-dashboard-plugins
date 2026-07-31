import { ToolDefinition } from '../types';
import {
  clampLimit,
  limitProperty,
  objectSchema,
  optionalStringParam,
  requireNonEmptyString,
  validateAgentId,
} from './common';

/**
 * Wazuh 5.0 rewrite: the 4.14 Manager endpoint
 * `GET /sca/{agent_id}/checks/{policy_id}` was REMOVED in 5.0 (returns 404 on 5.0). Per-check SCA
 * data now lives in the `wazuh-states-sca` Indexer index, one doc per check (mapping
 * verified against a live 5.0 stack). Field renames vs 4.14: id→check.id, title→check.name,
 * result→check.result, reason→check.reason, remediation→check.remediation; the old
 * file/directory/command fields have NO dedicated 5.0 field (per the matrix, likely folded into
 * the `check.rules` strings — carried as a rowField so the row expander still surfaces whatever
 * the rules text contains). `check.description`/`check.rationale` stay out of the digest (long
 * text, same budget decision as 4.14). `result` values assumed unchanged from 4.14
 * ('failed'/'passed'/'not applicable') — re-verify against real agent data when available.
 */
export const getScaChecksTool: ToolDefinition = {
  spec: {
    name: 'get_sca_checks',
    description:
      'Lists the individual checks within one Security Configuration Assessment (SCA) policy for ' +
      'one agent — check name, pass/fail result, reason, and (via the row expander) the ' +
      'remediation and rule text for each check. Use for "which SCA checks failed"/"why did this ' +
      'policy fail" drill-down questions AFTER get_sca_results has given you a policy_id for the ' +
      'agent — this tool needs that policy_id, it cannot discover one itself. Use ' +
      'result="failed" for "which checks fail" questions.',
    parameters: objectSchema(
      {
        agent_id: {
          type: 'string',
          description: 'Numeric Wazuh agent ID, e.g. "003".',
        },
        policy_id: {
          type: 'string',
          description:
            'SCA policy id to drill into, obtained from a prior get_sca_results call for this ' +
            'agent (the summary table’s "Policy ID" column).',
        },
        result: {
          type: 'string',
          description:
            'Filter by check result. Exact values only: "failed", "passed", or "not applicable".',
          enum: ['failed', 'passed', 'not applicable'],
        },
        search: {
          type: 'string',
          description:
            'Exact check name, or a LEADING prefix of one, e.g. "Ensure SSH root login is ' +
            'disabled" or "Ensure SSH". This is NOT a free-text substring search: these fields are ' +
            'exact keywords, so a mid-word fragment like "ssh" matches nothing. To find checks by ' +
            'topic, omit this and filter by result instead, then read the returned check names.',
        },
        limit: limitProperty(
          'Max number of checks to return (default 20, max 500).',
        ),
      },
      ['agent_id', 'policy_id'],
    ),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const agentId = validateAgentId(params.agent_id);
    const policyId = requireNonEmptyString(
      params.policy_id,
      'Parameter "policy_id" is required and must be a non-empty string.',
    );
    const limit = clampLimit(params.limit, 20, 500);
    const result = optionalStringParam(params.result);
    const search = optionalStringParam(params.search);
    return {
      target: 'indexer',
      index: 'wazuh-states-sca*',
      body: {
        query: {
          bool: {
            filter: [
              { term: { 'wazuh.agent.id': agentId } },
              { term: { 'policy.id': policyId.trim() } },
              ...(result ? [{ term: { 'check.result': result } }] : []),
              // `search` is EXACT-or-PREFIX, never substring. `check.name`/`check.description`/
              // `check.rationale` are all mapped `keyword` in 5.0, so the previous bare
              // `multi_match` silently returned nothing for the fragment its own description
              // invited: proven live, `search: "ssh"` -> 0 hits, while the full exact check name
              // -> 1 hit, against real check names like "Ensure SSH root login is disabled".
              //
              // The multi_match is kept (it is correct for a full exact value) and OR'd with a
              // non-leading `prefix` on `check.name`, so "Ensure SSH" also works. A true substring
              // search is deliberately NOT attempted: on a keyword field it needs a leading
              // wildcard, which this plugin's guardrails reject on purpose (unbounded term-dictionary
              // scan). The real long-term fix is an analyzed sub-field on these three fields in the
              // SCA index template, which is a platform-side change, not a plugin one. The parameter
              // description now states this limitation so the model stops generating fragments.
              ...(search
                ? [
                    {
                      bool: {
                        minimum_should_match: 1,
                        should: [
                          {
                            multi_match: {
                              query: search,
                              fields: [
                                'check.name',
                                'check.description',
                                'check.rationale',
                              ],
                            },
                          },
                          { prefix: { 'check.name': search.trim() } },
                        ],
                      },
                    },
                  ]
                : []),
            ],
          },
        },
        _source: [
          'check.id',
          'check.name',
          'check.result',
          'check.reason',
          'check.remediation',
          'check.rules',
        ],
        sort: ['_doc'],
        size: limit,
      },
    };
  },
  tableSpec: {
    columns: [
      { field: 'check.id', label: 'Check ID' },
      { field: 'check.name', label: 'Check' },
      // `check.result` is a pass/fail/not-applicable WORD, not a finding-severity level — plain
      // column, not `severity: true` (same rationale as the 4.14 version of this tool).
      { field: 'check.result', label: 'Result' },
      { field: 'check.reason', label: 'Reason' },
    ],
    // Row expander: remediation + the raw rule text (where 5.0 folds the old
    // file/directory/command detail, per the matrix — the investigative payload of this tool).
    rowFields: ['check.remediation', 'check.rules'],
  },
  // description/rationale excluded on purpose: hundreds of words each (same budget decision as
  // 4.14). remediation/rules are row-only for the same reason.
  digest: { sampleColumns: ['check.id', 'check.name', 'check.result'] },
};
