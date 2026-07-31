import { ToolDefinition } from '../types';
import {
  findingDigestColumns,
  findingRowFields,
  clampLimit,
  limitProperty,
  objectSchema,
  resolveTimeRange,
  STANDARD_FINDING_SAMPLE_COLUMNS,
  STANDARD_FINDING_TABLE_COLUMN_FIELDS,
  STANDARD_FINDING_TABLE_COLUMNS,
  timeRangeProperties,
} from './common';

function parseRuleTags(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
  const tags = raw.filter(
    (tag): tag is string => typeof tag === 'string' && tag.trim() !== '',
  );
  if (tags.length === 0) {
    throw new Error(
      'Parameter "rule_tags" is required and must be a non-empty array of strings.',
    );
  }
  return tags;
}

/**
 * Guards a real observed failure: asked "which users had sessions closed in the last 24
 * hours?", the model guessed rule.id 2003 and got 0 rows, then falsely reported no sessions
 * closed. Models cannot be trusted to know exact Wazuh rule IDs, so this tool searches by rule
 * CLASSIFICATION TAG(s) instead of guessing an ID -- the thing to reach for whenever a question
 * names a category of activity rather than a specific rule number.
 * Searches `wazuh.rule.tags` (a keyword array): a `term` query for one tag, `terms` for more than
 * one -- same array-accepting pattern as search_findings_by_multiple_agents. `wazuh.rule.tags` is
 * confirmed populated and live-verified against the indexer -- observed values follow an
 * `attack.<mitre-technique-id>` pattern plus severity words and generic rule descriptors (e.g.
 * `attack.t1014`, `high`, `wazuh-rootcheck`). That verification only covers the malware/rootkit
 * findings present in the dev dataset, though: the activity-category examples below ("pam",
 * "sshd", "authentication_success") are illustrative, NOT confirmed against real data -- this
 * dataset has no authentication/login findings to check them against. The description below
 * therefore does NOT assert those specific values as ground truth -- it tells the model to
 * discover tags via get_top_rules rather than invent them, so a hallucinated tag can't masquerade
 * as a verified one.
 */
export const searchFindingsByRuleTagTool: ToolDefinition = {
  spec: {
    name: 'search_findings_by_rule_tag',
    description:
      'Searches security findings belonging to one or more rule classification tags ' +
      '(wazuh.rule.tags), within a time range, most recent first. Use this for "which/what kind ' +
      'of findings" questions about a category of activity (logins, SSH, sudo, file integrity, ' +
      'authentication) when you do not know the exact numeric rule ID -- never guess a ' +
      'wazuh.rule.id. The exact tag vocabulary is deployment-specific: if you are unsure what tag ' +
      'to use, first aggregate with get_top_rules to see the real rules/tags in the data rather ' +
      'than guessing a tag value. If this tool returns 0 rows, your tag value was probably not ' +
      'present: broaden it or fall back to get_top_rules before concluding there were none.',
    parameters: objectSchema(
      {
        rule_tags: {
          type: 'array',
          description:
            'One or more exact wazuh.rule.tags values to match (matches any of them), e.g. a ' +
            'classification tag such as "pam", "sshd", "authentication_success".',
          items: { type: 'string' },
        },
        limit: limitProperty(
          'Max number of findings to return (default 20, max 500).',
        ),
        ...timeRangeProperties(),
      },
      ['rule_tags'],
    ),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const ruleTags = parseRuleTags(params.rule_tags);
    const limit = clampLimit(params.limit, 20, 500);
    const { gte, lte } = resolveTimeRange(params);
    const tagFilter =
      ruleTags.length === 1
        ? { term: { 'wazuh.rule.tags': ruleTags[0] } }
        : { terms: { 'wazuh.rule.tags': ruleTags } };
    return {
      target: 'indexer',
      index: 'wazuh-findings-v5*',
      body: {
        query: {
          bool: {
            filter: [tagFilter, { range: { '@timestamp': { gte, lte } } }],
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
