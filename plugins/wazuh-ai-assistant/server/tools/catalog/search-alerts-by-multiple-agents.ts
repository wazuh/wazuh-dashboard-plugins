import { ToolDefinition } from '../types';
import {
  alertDigestColumns,
  alertRowFields,
  clampLimit,
  limitProperty,
  minSeverityProperty,
  objectSchema,
  optionalStringParam,
  resolveTimeRange,
  severitiesAtOrAbove,
  STANDARD_ALERT_SAMPLE_COLUMNS,
  STANDARD_ALERT_TABLE_COLUMN_FIELDS,
  STANDARD_ALERT_TABLE_COLUMNS,
  timeRangeProperties,
} from './common';

/**
 * Ported from SEARCH_ALERTS_BY_MULTIPLE_AGENTS. `wazuh.agent.name` is mapped `keyword` at the top level
 * with no `.keyword` subfield needed, so this filters with a single `terms` clause on the exact
 * agent names rather than one `match` clause per name.
 * 5.0: retargeted to wazuh-findings-v5*; agent name field moved to `wazuh.agent.name`, and
 * min_severity is now a categorical severity word (see common.ts's severitiesAtOrAbove) applied
 * only when supplied, rather than a numeric rule.level floor defaulting to 0.
 */
export const searchAlertsByMultipleAgentsTool: ToolDefinition = {
  spec: {
    name: 'search_alerts_by_multiple_agents',
    description:
      'Searches security findings for findings from any of several named agents, at or above a ' +
      'minimum severity, within a time range. Use when the question names two or more agents; ' +
      'use search_alerts_by_agent instead for a single agent.',
    parameters: objectSchema(
      {
        agent_names: {
          type: 'array',
          description: 'Exact agent names to filter by (matches any of them).',
          items: { type: 'string' },
        },
        min_severity: minSeverityProperty(),
        limit: limitProperty(
          'Max number of alerts to return (default 20, max 500).',
        ),
        ...timeRangeProperties(),
      },
      ['agent_names'],
    ),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const agentNames = params.agent_names;
    if (
      !Array.isArray(agentNames) ||
      agentNames.length === 0 ||
      !agentNames.every(name => typeof name === 'string' && name.trim() !== '')
    ) {
      throw new Error(
        'Parameter "agent_names" is required and must be a non-empty array of strings.',
      );
    }
    const minSeverity = optionalStringParam(params.min_severity);
    const limit = clampLimit(params.limit, 20, 500);
    const { gte, lte } = resolveTimeRange(params);
    const filter: Record<string, unknown>[] = [
      { terms: { 'wazuh.agent.name': agentNames } },
      { range: { '@timestamp': { gte, lte } } },
    ];
    if (minSeverity) {
      filter.push({
        terms: { 'wazuh.rule.level': severitiesAtOrAbove(minSeverity) },
      });
    }
    return {
      target: 'indexer',
      index: 'wazuh-findings-v5*',
      body: {
        query: { bool: { filter } },
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
