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
 * Two OR'd signals, each an exact match against a keyword-mapped field: the MITRE T1110 (Brute
 * Force) technique id, and the `attack.t1110`/`attack.credential-access` `wazuh.rule.tags` pair —
 * both confirmed against the real rule catalog (`wazuh-threatintel-rules-a`), which carries
 * genuine T1110-tagged rules (e.g. "AWS GuardDuty brute force attack detected", "Failed
 * authentication attempt", "User account locked out") even when none has fired in a given
 * findings index yet.
 *
 * A prior third signal — an exact `terms` match on 4.x-style numeric `wazuh.rule.id` values
 * (e.g. "5710") — has been removed. In 5.0 `wazuh.rule.id` is always a UUID, so a fixed
 * numeric-id allowlist can never match; 5.0 has no equivalent "well-known id" concept to replace
 * it with.
 *
 * A tempting fourth signal is deliberately absent: a `*brute*` wildcard is rejected by this
 * plugin's lint (guardrails.ts's leading-wildcard check covers `query_string` bodies) and is
 * expensive cluster-side. An analyzed `match` on `wazuh.rule.title` for "brute force" is worse
 * than useless: `wazuh.rule.title` is mapped `keyword`, so a multi-token match only hits a
 * title that is *exactly* "brute force" — measured at 0 hits against data where this tool
 * returns 44 — while reading like a third safety net.
 */
export const getBruteForceTool: ToolDefinition = {
  spec: {
    name: 'get_brute_force',
    description:
      'Searches security findings for brute-force / repeated authentication-failure findings ' +
      'within a time range (MITRE technique T1110 or its rule tags), most recent first.',
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
                          'attack.t1110',
                          'attack.credential-access',
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
