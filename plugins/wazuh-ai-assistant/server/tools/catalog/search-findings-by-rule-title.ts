import { ToolDefinition } from '../types';
import {
  findingDigestColumns,
  findingRowFields,
  clampLimit,
  FINDING_SCOPE_NOTE,
  limitProperty,
  objectSchema,
  resolveTimeRange,
  STANDARD_FINDING_SAMPLE_COLUMNS,
  STANDARD_FINDING_TABLE_COLUMN_FIELDS,
  STANDARD_FINDING_TABLE_COLUMNS,
  timeRangeProperties,
} from './common';

function parseRuleTitles(value: unknown): string[] {
  const raw = Array.isArray(value)
    ? value
    : typeof value === 'string'
    ? [value]
    : [];
  const titles = raw.filter(
    (title): title is string =>
      typeof title === 'string' && title.trim() !== '',
  );
  if (titles.length === 0) {
    throw new Error(
      'Parameter "rule_titles" is required and must be a non-empty array of strings.',
    );
  }
  return titles;
}

/**
 * Exact match on `wazuh.rule.title` plus a time range. `wazuh.rule.title` is mapped `keyword`, so
 * a `term`/`terms` query is the correct exact-match form -- there is no partial/analyzed matching
 * here, the model must pass the exact title text (discover it via get_top_rules if unsure, same
 * pattern as search_findings_by_rule_tag.ts). `rule_titles` accepts one or more titles (matches
 * any of them) -- same array-accepting pattern as search_findings_by_multiple_agents.
 *
 * Replaces the former `search_alerts_by_rule_id` tool. In 5.0 `wazuh.rule.id` is a UUID, not the
 * short numeric id analysts memorized in 4.x (e.g. "5710"), so a "search by rule ID" premise no
 * longer works for a human-facing question -- the rule's title is now the reachable identifier.
 */
export const searchFindingsByRuleTitleTool: ToolDefinition = {
  spec: {
    name: 'search_findings_by_rule_title',
    description:
      'Searches security findings triggered by one or more exact rule titles, within a time ' +
      `range, most recent first. ${FINDING_SCOPE_NOTE} Use when the question names a specific ` +
      'rule by its exact title text. If unsure of the exact title, first aggregate with ' +
      'get_top_rules rather than guessing one.',
    parameters: objectSchema(
      {
        rule_titles: {
          type: 'array',
          description:
            'One or more exact wazuh.rule.title values to match (matches any of them), e.g. ' +
            '"Wazuh Rootcheck - Rootkit or malware detected".',
          items: { type: 'string' },
        },
        limit: limitProperty(
          'Max number of findings to return (default 20, max 500).',
        ),
        ...timeRangeProperties(),
      },
      ['rule_titles'],
    ),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const ruleTitles = parseRuleTitles(params.rule_titles);
    const limit = clampLimit(params.limit, 20, 500);
    const { gte, lte } = resolveTimeRange(params);
    const titleFilter =
      ruleTitles.length === 1
        ? { term: { 'wazuh.rule.title': ruleTitles[0] } }
        : { terms: { 'wazuh.rule.title': ruleTitles } };
    return {
      target: 'indexer',
      index: 'wazuh-findings-v5*',
      body: {
        query: {
          bool: {
            filter: [titleFilter, { range: { '@timestamp': { gte, lte } } }],
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
