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
 * Exact match on `wazuh.rule.title` plus a time range. `wazuh.rule.title` is mapped `keyword`, so a
 * `term` query is the correct exact-match form -- there is no partial/analyzed matching here, the
 * model must pass the exact title text (discover it via get_top_rules if unsure, same pattern as
 * search_findings_by_rule_group.ts).
 *
 * Replaces the former `search_alerts_by_rule_id` tool. In 5.0 `wazuh.rule.id` is a UUID, not the
 * short numeric id analysts memorized in 4.x (e.g. "5710"), so a "search by rule ID" premise no
 * longer works for a human-facing question -- the rule's title is now the reachable identifier.
 */
export const searchFindingsByRuleTitleTool: ToolDefinition = {
  spec: {
    name: 'search_findings_by_rule_title',
    description:
      'Searches security findings for findings triggered by one exact rule title, within a time ' +
      'range, most recent first. Use when the question names a specific rule by its exact title ' +
      'text. If unsure of the exact title, first aggregate with get_top_rules rather than guessing ' +
      'one.',
    parameters: objectSchema(
      {
        rule_title: {
          type: 'string',
          description:
            'Exact wazuh.rule.title value to match, e.g. "Wazuh Rootcheck - Rootkit or malware ' +
            'detected".',
        },
        limit: limitProperty(
          'Max number of findings to return (default 20, max 500).',
        ),
        ...timeRangeProperties(),
      },
      ['rule_title'],
    ),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const ruleTitle = requireNonEmptyString(
      params.rule_title,
      'Parameter "rule_title" is required and must be a non-empty string.',
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
              { term: { 'wazuh.rule.title': ruleTitle } },
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
