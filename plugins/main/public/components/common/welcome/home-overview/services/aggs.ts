/* eslint-disable camelcase */
import { SeverityBand } from './types';

/**
 * OpenSearch aggregation builders for the OVERVIEW section. These are pure — no
 * data-source coupling — so they can be unit-tested and reused across the
 * batched findings search and the inventory searches.
 */

export const SEVERITY_BANDS: SeverityBand[] = [
  'critical',
  'high',
  'medium',
  'low',
];

/** Field holding the Finding Severity band string on the findings index. */
export const FINDING_SEVERITY_FIELD = 'wazuh.rule.level';
export const MITRE_TACTIC_NAME_FIELD = 'wazuh.rule.mitre.tactic.name';
export const HOST_OS_NAME_FIELD = 'host.os.name';
export const PROCESS_NAME_FIELD = 'process.name';

/**
 * Single `filters` aggregation with one named bucket per severity band, so all
 * four counts come back in one findings search (rather than one query per band).
 */
export function buildSeverityFiltersAgg() {
  const filters: Record<string, unknown> = {};
  for (const band of SEVERITY_BANDS) {
    filters[band] = { match_phrase: { [FINDING_SEVERITY_FIELD]: band } };
  }
  return { severity: { filters: { filters } } };
}

export function buildTopTermsAgg(name: string, field: string, size = 5) {
  return { [name]: { terms: { field, size } } };
}

/** The OVERVIEW findings batch: severity bands + top MITRE tactics, one search. */
export function buildFindingsOverviewAggs(topTacticsSize = 10) {
  return {
    ...buildSeverityFiltersAgg(),
    ...buildTopTermsAgg('tactics', MITRE_TACTIC_NAME_FIELD, topTacticsSize),
  };
}
