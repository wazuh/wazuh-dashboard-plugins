import { ToolDefinition } from '../types';
import {
  alertDigestColumns,
  alertRowFields,
  clampLimit,
  limitProperty,
  objectSchema,
  resolveTimeRange,
  STANDARD_ALERT_SAMPLE_COLUMNS,
  STANDARD_ALERT_TABLE_COLUMN_FIELDS,
  STANDARD_ALERT_TABLE_COLUMNS,
  timeRangeProperties,
} from './common';

/**
 * Brute-force and repeated-authentication-failure findings, most recent first.
 *
 * Three OR'd signals, each an exact match against a keyword-mapped field: the MITRE T1110 (Brute
 * Force) technique id, the authentication-failure `wazuh.rule.tags`, and the well-known sshd
 * authentication-failure rule ids (sent as strings, which is correct whether `wazuh.rule.id` is mapped
 * `keyword` or numeric — `search-alerts-by-rule-id.ts` documents the same reasoning).
 *
 * Two tempting fourth signals are deliberately absent. A `*brute*` wildcard is rejected by this
 * plugin's lint (guardrails.ts's leading-wildcard check covers `query_string` bodies) and is
 * expensive cluster-side. An analyzed `match` on `wazuh.rule.description` for "brute force" is worse
 * than useless: `wazuh.rule.description` is mapped `keyword`, so a multi-token match only hits a
 * description that is *exactly* "brute force" — measured at 0 hits against data where this tool
 * returns 44 — while reading like a third safety net.
 *
 * The `wazuh.rule.tags` vocabulary below is the 4.x spelling and has not been confirmed against a
 * populated findings-v5 index. If it turns out to be wrong the tool still works: the T1110 and
 * rule-id clauses carry it, and a wrong tag name matches nothing rather than over-matching.
 */
export const getBruteForceTool: ToolDefinition = {
  spec: {
    name: 'get_brute_force',
    description:
      'Searches security findings for brute-force / repeated authentication-failure findings ' +
      'within a time range (MITRE technique T1110, authentication-failure rule tags, or known ' +
      'authentication-failure rule ids), most recent first.',
    parameters: objectSchema({
      limit: limitProperty(
        'Max number of alerts to return (default 20, max 500).',
      ),
      ...timeRangeProperties(),
    }),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const limit = clampLimit(params.limit, 20, 500);
    const { gte, lte } = resolveTimeRange(params);
    return {
      target: 'indexer',
      index: 'wazuh-findings-v5*',
      body: {
        query: {
          bool: {
            filter: [
              {
                bool: {
                  should: [
                    { term: { 'wazuh.rule.mitre.technique.id': 'T1110' } },
                    {
                      terms: {
                        'wazuh.rule.tags': [
                          'authentication_failures',
                          'authentication_failed',
                        ],
                      },
                    },
                    // Well-known sshd authentication-failure rule ids (see this file's header for
                    // why an exact `terms` filter is used rather than a description match).
                    {
                      terms: {
                        'wazuh.rule.id': [
                          '5710',
                          '5712',
                          '5716',
                          '5720',
                          '5760',
                        ],
                      },
                    },
                  ],
                  minimum_should_match: 1,
                },
              },
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
