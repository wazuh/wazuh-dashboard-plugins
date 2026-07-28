import { ToolDefinition } from '../types';
import {
  alertDigestColumns,
  alertRowFields,
  clampLimit,
  limitProperty,
  objectSchema,
  requireNonEmptyString,
  resolveTimeRange,
  STANDARD_ALERT_SAMPLE_COLUMNS,
  STANDARD_ALERT_TABLE_COLUMN_FIELDS,
  STANDARD_ALERT_TABLE_COLUMNS,
  timeRangeProperties,
} from './common';

/**
 * Guards a real observed failure: asked "which users had sessions closed in the last 24
 * hours?", the model guessed rule.id 2003 and got 0 rows, then falsely reported no sessions
 * closed. Models cannot be trusted to know exact Wazuh rule IDs, so this tool searches by a rule
 * CLASSIFICATION TAG instead of guessing an ID -- the thing to reach for whenever a question names
 * a category of activity rather than a specific rule number.
 * 5.0: retargeted to wazuh-findings-v5*; the 4.14 rule.groups array has no 5.0 equivalent (retired
 * outright, not renamed) and is replaced by `wazuh.rule.tags` (keyword array), matched with a
 * plain `term` (same pattern as search_alerts_by_rule_id.ts). IMPORTANT: the exact `wazuh.rule.tags` VOCABULARY on findings-v5 is
 * NOT yet confirmed against live data (the 4.14 group names like "pam"/"sshd" may or may not carry
 * over). The description below therefore does NOT assert specific tag values as ground truth --
 * unlike the frozen 4.14 tool, it tells the model to discover tags via get_top_rules rather than
 * invent them, so a hallucinated tag can't masquerade as a verified one.
 */
export const searchAlertsByRuleGroupTool: ToolDefinition = {
  spec: {
    name: 'search_alerts_by_rule_group',
    description:
      'Searches security findings belonging to one rule classification tag (rule.tags), within a ' +
      'time range, most recent first. Use this for "which/what kind of alerts" questions about a ' +
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
          'Max number of alerts to return (default 20, max 500).',
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
    columns: STANDARD_ALERT_TABLE_COLUMNS,
    rowFields: alertRowFields(STANDARD_ALERT_TABLE_COLUMN_FIELDS),
  },
  digest: { sampleColumns: alertDigestColumns(STANDARD_ALERT_SAMPLE_COLUMNS) },
};
