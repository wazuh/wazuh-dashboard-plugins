import { ToolDefinition } from '../types';
import {
  findingArtifactFilterClauses,
  findingArtifactFilterProperties,
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
      'Searches security findings for PowerShell-related activity within a time range, most ' +
      `recent first. Use for "suspicious PowerShell activity" questions. ${FINDING_SCOPE_NOTE}`,
    parameters: objectSchema({
      limit: limitProperty(
        'Max number of findings to return (default 20, max 500).',
      ),
      ...timeRangeProperties(),
      ...findingArtifactFilterProperties(),
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
            // `wazuh.rule.title` is mapped `keyword`, so a single-token analyzed `match` on it
            // would only hit a document whose title is EXACTLY "powershell" — effectively
            // never matching real data. This tool avoids that trap entirely by ORing several
            // robust signals instead of trusting the title: the canonical ATT&CK technique id
            // for PowerShell, the `wazuh.rule.tags` vocabulary, and the Windows PowerShell process
            // names. The mandatory time range stays in `filter` so the guardrail's required-context
            // time check still counts it. Any caller-supplied artifact filter (source_ip,
            // process_name, etc. -- see common.ts's findingArtifactFilterClauses) is ALSO appended
            // to this `filter` array, so a supplied process_name narrows the OR'd `should` set
            // further rather than replacing it.
            filter: [
              { range: { '@timestamp': { gte, lte } } },
              ...findingArtifactFilterClauses(params),
            ],
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
    columns: STANDARD_FINDING_TABLE_COLUMNS,
    rowFields: findingRowFields(STANDARD_FINDING_TABLE_COLUMN_FIELDS),
  },
  digest: {
    sampleColumns: findingDigestColumns(STANDARD_FINDING_SAMPLE_COLUMNS),
  },
};
