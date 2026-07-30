import { ToolDefinition } from '../types';
import {
  findingDigestColumns,
  findingRowFields,
  clampLimit,
  limitProperty,
  objectSchema,
  requireNonEmptyString,
  resolveTimeRange,
  STANDARD_FINDING_SAMPLE_COLUMNS,
  STANDARD_FINDING_TABLE_COLUMN_FIELDS,
  STANDARD_FINDING_TABLE_COLUMNS,
  timeRangeProperties,
} from './common';

/**
 * Guards a real observed failure: asked "which users had sessions closed in the last 24
 * hours?", the model guessed rule.id 2003 and got 0 rows, then falsely reported no sessions
 * closed. Models cannot be trusted to know exact Wazuh rule IDs, so this tool searches by a rule
 * CLASSIFICATION TAG instead of guessing an ID -- the thing to reach for whenever a question names
 * a category of activity rather than a specific rule number.
 * Searches `wazuh.rule.tags` (a keyword array) with a plain `term` match (same pattern as
 * search_findings_by_rule_title.ts). IMPORTANT: the exact `wazuh.rule.tags` vocabulary has not yet been
 * confirmed against live data. The description below therefore does NOT assert specific tag
 * values as ground truth -- it tells the model to discover tags via get_top_rules rather than
 * invent them, so a hallucinated tag can't masquerade as a verified one.
 */
export const searchFindingsByRuleGroupTool: ToolDefinition = {
  spec: {
    name: 'search_findings_by_rule_group',
    description:
      'Searches security findings belonging to one rule classification tag (rule.tags), within a ' +
      'time range, most recent first. Use this for "which/what kind of findings" questions about a ' +
      'category of activity (logins, SSH, sudo, file integrity, authentication) when you do not ' +
      'know the exact numeric rule ID -- never guess a rule.id. The exact tag vocabulary is ' +
      'deployment-specific: if you are unsure what tag to use, first aggregate with get_top_rules ' +
      'to see the real rules/tags in the data rather than guessing a tag value. If this tool ' +
      'returns 0 rows, your tag value was probably not present: broaden it or fall back to ' +
      'get_top_rules before concluding there were none.',
    parameters: objectSchema(
      {
        rule_group: {
          type: 'string',
          description:
            'Exact rule.tags value to match, e.g. a classification tag such as "pam", "sshd", ' +
            '"authentication_success".',
        },
        limit: limitProperty(
          'Max number of findings to return (default 20, max 500).',
        ),
        ...timeRangeProperties(),
      },
      ['rule_group'],
    ),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const ruleGroup = requireNonEmptyString(
      params.rule_group,
      'Parameter "rule_group" is required and must be a non-empty string.',
    );
    const limit = clampLimit(params.limit, 20, 500);
    const { gte, lte } = resolveTimeRange(params);
    return {
      target: 'indexer',
      index: 'wazuh-findings-v5*',
      body: {
        query: {
          bool: {
            filter: [
              { term: { 'wazuh.rule.tags': ruleGroup } },
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
    columns: STANDARD_FINDING_TABLE_COLUMNS,
    rowFields: findingRowFields(STANDARD_FINDING_TABLE_COLUMN_FIELDS),
  },
  digest: {
    sampleColumns: findingDigestColumns(STANDARD_FINDING_SAMPLE_COLUMNS),
  },
};
