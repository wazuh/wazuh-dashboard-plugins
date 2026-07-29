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
 * Matches PowerShell-related findings without a `*powershell*` wildcard (blocked by this plugin's
 * lint and expensive cluster-side). Instead ORs several robust signals: the canonical ATT&CK
 * technique id for PowerShell, the `wazuh.rule.tags` vocabulary, and known Windows PowerShell
 * process names — the same shape `get_brute_force` uses, avoiding a single fragile
 * text-match condition.
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
            // `wazuh.rule.description` is mapped `keyword`, so a single-token analyzed `match` on it
            // would only hit a document whose description is EXACTLY "powershell" — effectively
            // never matching real data. This tool avoids that trap entirely by ORing several
            // robust signals instead of trusting the description: the canonical ATT&CK technique id
            // for PowerShell, the `wazuh.rule.tags` vocabulary, and the Windows PowerShell process
            // names. The mandatory time range stays in `filter` so the guardrail's required-context
            // time check still counts it.
            //
            // Same caveat `get_brute_force` records for its own tag list: the `wazuh.rule.tags`
            // vocabulary, and whether `process.name` is populated for PowerShell events, are
            // unconfirmed against real 5.0 Windows agent data. The technique-id clause does not
            // depend on either, so a wrong tag name narrows this tool rather than breaking it.
            filter: [{ range: { '@timestamp': { gte, lte } } }],
            minimum_should_match: 1,
            should: [
              { term: { 'wazuh.rule.mitre.technique.id': 'T1059.001' } },
              {
                terms: {
                  'wazuh.rule.tags': ['powershell', 'windows_powershell'],
                },
              },
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
