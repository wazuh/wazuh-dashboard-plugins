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
 * Ported from 4.14, which used `query_string` wildcards
 * (`rule.description:(*powershell* OR *Powershell*)`), now blocked by this plugin's lint. Rebuilt
 * as an analyzed `match` on `rule.description` for "powershell" (the standard analyzer lowercases
 * both the indexed text and the query term, so case is not an issue). SEMANTIC DIFFERENCE from the
 * 4.14 version: `match` requires "powershell" to appear as its own token — it will not match
 * substrings glued to other characters the way a mid-word wildcard would (e.g. "powershell.exe"
 * still matches since tokenizers split on `.`, but a hypothetical "xpowershell" would not);
 * accepted trade-off for lint-safety and lower cluster cost.
 * 5.0: retargeted to wazuh-findings-v5*.
 */
export const getSuspiciousPowershellTool: ToolDefinition = {
  spec: {
    name: 'get_suspicious_powershell',
    description:
      'Searches security findings for findings whose rule description mentions PowerShell, ' +
      'within a time range, most recent first. Use for "suspicious PowerShell activity" questions.',
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
            // 5.0 CORRECTNESS FIX: this filtered on `match: {'rule.description': 'powershell'}`
            // ALONE, which can NEVER match on Wazuh 5.0 — `rule.description` is mapped `keyword`
            // there (verified live on 5.0.0-beta3), so a single-token analyzed `match` only hits a
            // document whose description is EXACTLY "powershell". Confirmed empirically over the
            // same data: `match: powershell` -> 0 hits, `match: <full description string>` -> 9.
            // The plugin's own system prompt already warns about this keyword-vs-analyzed trap; the
            // tool contradicted it and was effectively dead on 5.0.
            //
            // Rebuilt on the same shape `get_brute_force` uses — which works on 5.0 precisely
            // because it ORs several robust signals instead of trusting the description: the
            // canonical ATT&CK technique id for PowerShell, the `rule.tags` vocabulary, and the
            // Windows PowerShell process names. The mandatory time range stays in `filter` so the
            // guardrail's required-context time check still counts it.
            //
            // Same caveat `get_brute_force` records for its own tag list: the `rule.tags`
            // vocabulary, and whether `process.name` is populated for PowerShell events, are
            // unconfirmed against real 5.0 Windows agent data. The technique-id clause does not
            // depend on either, so a wrong tag name narrows this tool rather than breaking it.
            filter: [{ range: { '@timestamp': { gte, lte } } }],
            minimum_should_match: 1,
            should: [
              { term: { 'rule.mitre.technique.id': 'T1059.001' } },
              { terms: { 'rule.tags': ['powershell', 'windows_powershell'] } },
              {
                terms: {
                  'process.name': ['powershell.exe', 'pwsh.exe', 'powershell'],
                },
              },
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
