import { ToolDefinition } from '../types';
import { clampLimit, limitProperty, objectSchema } from './common';

/** Confirmed live against `wazuh-threatintel-rules-a` (a `terms` agg on `document.level`, 268/268
 * docs bucketed, no long tail) -- the vocabulary happens to reuse the same 5 words as findings-v5's
 * severity scale, but this is a DIFFERENT field on a DIFFERENT (Sigma-shaped) document: no ordering
 * ("at or above") is assumed or exposed here, only exact match. Do not import
 * `common.ts`'s `severityProperty()`/`severityFilterValues()` for this field. */
const RULE_LEVELS = ['informational', 'low', 'medium', 'high', 'critical'] as const;

/** Confirmed live against `wazuh-threatintel-rules-a` (a `terms` agg on `document.status`,
 * 268/268 docs bucketed, no long tail). */
const RULE_STATUSES = ['stable', 'experimental', 'test'] as const;

const ENABLED_VALUES = ['enabled', 'disabled', 'any'] as const;

/**
 * Security Analytics correlation/detection rules (Sigma-shaped documents: `sigma_id`, `logsource`,
 * `threat.{tactic,technique,subtechnique}`) -- distinct from findings-v5's rule taxonomy, and from
 * `wazuh-threatintel-{decoders,integrations,policies,filters,kvdbs}` (see
 * get-threat-intel-components.ts), which are pipeline/config content with no rule-level fields of
 * their own. `enabled` is a 3-value enum rather than a boolean: a `type:'boolean'` param defaulting
 * to `true` would make "how many rules exist in total" impossible to ask without a value meaning
 * "don't filter" (omission already means true) -- exactly the class of silently-partial behavior
 * this catalog's guardrails exist to prevent elsewhere. `level`/`status`/`tag`/`technique_id` are
 * each a single value (no array generalization): the corpus is 269 docs with no time range, so a
 * caller wanting several just omits the filter and reads the table -- cheap here in a way it never
 * is on findings-v5.
 */
export const getDetectionRulesTool: ToolDefinition = {
  spec: {
    name: 'get_detection_rules',
    description:
      'Lists Security Analytics detection/correlation rules (the ruleset content itself -- ' +
      'NOT findings that fired). Use for "which rules are active/enabled", "what does rule X ' +
      'detect" questions. Not for findings/alerts that a rule matched -- use the finding tools ' +
      'for that.',
    parameters: objectSchema({
      enabled: {
        type: 'string',
        description:
          'Filter by whether the rule is enabled. Defaults to "enabled" (the common "active ' +
          'rules" intent). Use "any" to include disabled rules too, e.g. for "how many rules ' +
          'exist in total".',
        enum: [...ENABLED_VALUES],
      },
      status: {
        type: 'string',
        description: 'Filter by rule maturity status.',
        enum: [...RULE_STATUSES],
      },
      level: {
        type: 'string',
        description:
          'Filter by rule level (exact match only -- not a floor/ceiling like finding severity).',
        enum: [...RULE_LEVELS],
      },
      tag: {
        type: 'string',
        description: 'Filter by one exact rule tag.',
      },
      technique_id: {
        type: 'string',
        description: 'Filter by one exact MITRE ATT&CK technique ID, e.g. "T1110".',
      },
      limit: limitProperty(
        'Max number of rules to return (default 20, max 500).',
      ),
    }),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const enabled =
      typeof params.enabled === 'string' &&
      (ENABLED_VALUES as readonly string[]).includes(params.enabled)
        ? params.enabled
        : 'enabled';
    const status = typeof params.status === 'string' ? params.status.trim() : undefined;
    const level = typeof params.level === 'string' ? params.level.trim() : undefined;
    const tag = typeof params.tag === 'string' ? params.tag.trim() : undefined;
    const techniqueId =
      typeof params.technique_id === 'string' ? params.technique_id.trim() : undefined;
    const limit = clampLimit(params.limit, 20, 500);

    const filter: Record<string, unknown>[] = [];
    if (enabled !== 'any') {
      filter.push({ term: { 'document.enabled': enabled === 'enabled' } });
    }
    if (status) {
      filter.push({ term: { 'document.status': status } });
    }
    if (level) {
      filter.push({ term: { 'document.level': level } });
    }
    if (tag) {
      filter.push({ term: { 'document.tags': tag } });
    }
    if (techniqueId) {
      filter.push({ term: { 'document.threat.technique.id': techniqueId } });
    }

    return {
      target: 'indexer',
      index: 'wazuh-threatintel-rules*',
      body: {
        query: { bool: { filter } },
        _source: [
          'document.name',
          'document.level',
          'document.status',
          'document.enabled',
          'document.threat.technique.id',
          'document.tags',
          'document.logsource.product',
          'document.logsource.category',
          'document.metadata.title',
        ],
        sort: ['_doc'],
        size: limit,
      },
    };
  },
  tableSpec: {
    columns: [
      { field: 'document.name', label: 'Name' },
      // `document.level` is the Sigma rule's own level, not a findings severity -- no `severity:
      // true` badge (same reasoning get-sca-checks.ts applies to check.result).
      { field: 'document.level', label: 'Level' },
      { field: 'document.status', label: 'Status' },
      { field: 'document.enabled', label: 'Enabled' },
      { field: 'document.threat.technique.id', label: 'Technique' },
      { field: 'document.tags', label: 'Tags' },
    ],
    // document.metadata.title mostly duplicates document.name for Sigma-derived rules -- row-only.
    // document.detection (the raw Sigma detection tree) is `object,enabled:false` in the live
    // mapping: not indexed, so it can never be filtered/sorted/aggregated, only retrieved as an
    // opaque _source blob -- excluded entirely, it is unreadable noise for a small model anyway.
    // Rule-authoring metadata (falsepositives/fields/related/taxonomy/scope/license/sigma_id/id)
    // is likewise excluded: not analyst-facing.
    rowFields: [
      'document.logsource.product',
      'document.logsource.category',
      'document.metadata.title',
    ],
  },
  digest: {
    sampleColumns: [
      'document.name',
      'document.level',
      'document.status',
      'document.enabled',
      'document.threat.technique.id',
      'document.tags',
      'document.logsource.product',
      'document.logsource.category',
    ],
  },
};
