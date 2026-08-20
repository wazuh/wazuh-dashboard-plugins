import { ToolDefinition } from '../types';
import {
  clampLimit,
  limitProperty,
  nameFilterClause,
  nameFilterProperty,
  objectSchema,
  parseSecurityAnalyticsSpace,
  SECURITY_ANALYTICS_SPACES,
} from './common';

/** Confirmed live against `wazuh-threatintel-rules-a` (a `terms` agg on `document.level`, 268/268
 * docs bucketed, no long tail) -- the vocabulary happens to reuse the same 5 words as findings-v5's
 * severity scale, but this is a DIFFERENT field on a DIFFERENT (Sigma-shaped) document: no ordering
 * ("at or above") is assumed or exposed here, only exact match. Do not import
 * `common.ts`'s `severityProperty()`/`severityFilterValues()` for this field. */
const RULE_LEVELS = [
  'informational',
  'low',
  'medium',
  'high',
  'critical',
] as const;

/** Confirmed live against `wazuh-threatintel-rules-a` (a `terms` agg on `document.status`,
 * 268/268 docs bucketed, no long tail). */
const RULE_STATUSES = ['stable', 'experimental', 'test'] as const;

const ENABLED_VALUES = ['enabled', 'disabled', 'any'] as const;

/**
 * Security Analytics correlation rules (Sigma-shaped documents: `sigma_id`, `logsource`,
 * `mitre.{tactic,technique,subtechnique}`) -- distinct from findings-v5's rule taxonomy, and from
 * `wazuh-threatintel-{decoders,integrations,policies,filters,kvdbs}` (see
 * get-threat-intel-components.ts), which are pipeline/config content with no rule-level fields of
 * their own. `enabled` is a 3-value enum rather than a boolean: a `type:'boolean'` param defaulting
 * to `true` would make "how many rules exist in total" impossible to ask without a value meaning
 * "don't filter" (omission already means true) -- exactly the class of silently-partial behavior
 * this catalog's guardrails exist to prevent elsewhere. `level`/`status`/`tag`/
 * `logsource_product`/`name` are each a single value (no array generalization): the corpus is
 * 269 docs with no time range, so a caller wanting several just omits the filter and reads the
 * table -- cheap here in a way it never is on findings-v5. There is deliberately no
 * `technique_id` parameter -- see `tag`'s own doc comment below for why it was removed rather
 * than pointed at a fixed field path.
 */
export const getRulesTool: ToolDefinition = {
  spec: {
    name: 'get_rules',
    description:
      'Lists Security Analytics correlation rules (the ruleset content itself -- ' +
      'NOT findings that fired). These are Sigma-shaped rules identified by a UUID and a title ' +
      '(e.g. "Server side template injection strings") -- a DIFFERENT namespace from the ' +
      'classic numeric rule id (e.g. "rule 5710") an analyst sees on a finding/alert. A ' +
      'numeric-id question is almost always about a finding, not this catalog: use the finding ' +
      'tools (which read `wazuh.rule.id` on findings/alerts) for "what does rule 5710 do", and ' +
      'use this tool for "what does the SSTI/SSH/... rule detect" or "which rules are ' +
      'active/enabled" questions asked by name or topic. Not for findings/alerts that a rule ' +
      'matched -- use the finding tools for that.',
    parameters: objectSchema({
      name: nameFilterProperty('rule'),
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
        description:
          'Filter by one exact rule tag (lowercase). For a MITRE ATT&CK technique, pass its ' +
          '"attack.<id>" tag form (e.g. "attack.t1190" for T1190) -- this is the tag vocabulary ' +
          'this field actually holds (confirmed live). There is deliberately no separate ' +
          '`technique_id` parameter: the tool used to expose one against ' +
          "`document.mitre.technique.id`, but that path is absent from this index's mapping " +
          'and can only ever return 0 rows (see ' +
          'AI/plan/qa-rules-decoders-rootcause.md, defect #2) -- removed rather than fixed onto ' +
          'this field, because `technique.id` here is a real MAPPED keyword that is simply ' +
          'unpopulated (0 docs), so a filter on it would be silently, permanently empty too. ' +
          '`document.mitre.technique.id` stays queryable via the "Technique" table column (a ' +
          'plain _source read, mapping-agnostic), just not filterable.',
      },
      logsource_product: {
        type: 'string',
        description:
          'Filter by the rule\'s log source product, e.g. "linux", "apache-http", "azure", ' +
          '"o365", "docker", "suricata". Discover the real values for this dataset with an ' +
          'unfiltered call first and read the "Product" row field / breakdown.',
      },
      space: {
        type: 'string',
        description:
          'Filter by Security Analytics space. Omit to search across every space (the default).',
        enum: [...SECURITY_ANALYTICS_SPACES],
      },
      limit: limitProperty(
        'Max number of rules to return (default 20, max 500).',
      ),
    }),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const name =
      typeof params.name === 'string' ? params.name.trim() : undefined;
    const enabled =
      typeof params.enabled === 'string' &&
      (ENABLED_VALUES as readonly string[]).includes(params.enabled)
        ? params.enabled
        : 'enabled';
    const status =
      typeof params.status === 'string' ? params.status.trim() : undefined;
    const level =
      typeof params.level === 'string' ? params.level.trim() : undefined;
    // F3 (review): `document.tags` is a case-sensitive keyword whose live vocabulary is entirely
    // lowercase (e.g. "attack.t1190"), while ATT&CK ids are conventionally written uppercase --
    // lowercase an "attack.*" tag so a model-written "attack.T1190" still hits instead of
    // silently returning 0 rows.
    const rawTag =
      typeof params.tag === 'string' ? params.tag.trim() : undefined;
    const tag =
      rawTag && /^attack\./i.test(rawTag) ? rawTag.toLowerCase() : rawTag;
    const logsourceProduct =
      typeof params.logsource_product === 'string'
        ? params.logsource_product.trim()
        : undefined;
    const space = parseSecurityAnalyticsSpace(params.space);
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
    if (space) {
      filter.push({ term: { 'space.name': space } });
    }
    if (tag) {
      filter.push({ term: { 'document.tags': tag } });
    }
    if (logsourceProduct) {
      filter.push({ term: { 'document.logsource.product': logsourceProduct } });
    }
    if (name) {
      filter.push(
        nameFilterClause(
          name,
          ['document.metadata.title'],
          'document.metadata.description',
        ),
      );
    }

    return {
      target: 'indexer',
      index: 'wazuh-threatintel-rules*',
      body: {
        query: { bool: { filter } },
        // `space.name` is read by executor.ts's `resolveSecurityAnalyticsSpace` to fill in
        // `buildSecurityAnalyticsLink`'s `space`, and also shown as its own "Space" table column.
        // `document.metadata.description` (mapped `text`, populated 126/126 live) closes defect
        // #4: it is what actually answers the tool's own advertised "what does rule X detect" --
        // kept out of `tableSpec.columns` (too wide for a table cell) and surfaced via `rowFields`/
        // `digest.sampleColumns` instead, same treatment as the vulnerability tools' description.
        _source: [
          'document.metadata.title',
          'document.metadata.description',
          'document.level',
          'document.status',
          'document.enabled',
          'document.mitre.technique.id',
          'document.tags',
          'document.logsource.product',
          'document.logsource.category',
          'space.name',
        ],
        sort: ['_doc'],
        size: limit,
      },
    };
  },
  // "Open in Security Analytics" deep link -- `space` is resolved by executor.ts from the
  // executed result's own `space.name` values (see resolveSecurityAnalyticsSpace's doc comment);
  // this tool has only one destination page, unlike get-threat-intel-components.ts's per-type map.
  buildSecurityAnalyticsLink(_params, space) {
    return {
      label: 'Open in Security Analytics',
      url: `/app/rules#/rules?space=${space}`,
    };
  },
  tableSpec: {
    columns: [
      { field: 'document.metadata.title', label: 'Title' },
      // `document.level` is the Sigma rule's own level, not a findings severity -- no `severity:
      // true` badge (same reasoning get-sca-checks.ts applies to check.result).
      { field: 'document.level', label: 'Level' },
      { field: 'document.status', label: 'Status' },
      { field: 'document.enabled', label: 'Enabled' },
      { field: 'document.mitre.technique.id', label: 'Technique' },
      // Content is namespaced across draft/test/custom/standard spaces (confirmed live) -- shown
      // as its own column so a mixed-space result set is visibly mixed, which matters directly
      // for `buildSecurityAnalyticsLink`'s single-space-per-table link. Under the client's
      // MAX_VISIBLE_RESULT_COLUMNS budget (issue #8921) Space must therefore sit INSIDE the
      // visible 6; Tags — a long multi-value array better read in the row expander anyway — is
      // the column demoted to position 7 (not deleted: still queried, still in every row).
      { field: 'space.name', label: 'Space' },
      { field: 'document.tags', label: 'Tags' },
    ],
    // document.detection (the raw Sigma detection tree) is `object,enabled:false` in the live
    // mapping: not indexed, so it can never be filtered/sorted/aggregated, only retrieved as an
    // opaque _source blob -- excluded entirely, it is unreadable noise for a small model anyway.
    // Rule-authoring metadata (falsepositives/fields/related/taxonomy/scope/license/sigma_id/id)
    // is likewise excluded: not analyst-facing.
    rowFields: [
      'document.logsource.product',
      'document.logsource.category',
      'document.metadata.description',
    ],
  },
  digest: {
    sampleColumns: [
      'document.metadata.title',
      'document.metadata.description',
      'document.level',
      'document.status',
      'document.enabled',
      'document.mitre.technique.id',
      'document.tags',
      'document.logsource.product',
      'document.logsource.category',
      'space.name',
    ],
    // Synthetic fallback (issue #8920 item 1): the ruleset is thousands of docs against a default
    // limit of 20, so "what log sources / rule levels does the ruleset cover" was being answered
    // from 5 sample rows. Both fields are already returned in `_source` (getByPath groups the
    // RETURNED rows — no AGG_FIELD_ALLOWLIST entry or live mapping verification is needed for the
    // digest-level grouping, unlike a real terms aggregation) and both are vendor-curated enums,
    // structurally safe under privacy (field-policy-coverage.test.ts's
    // KNOWN_SAFE_STRUCTURAL_FIELDS). Page-scoped with `breakdownNote` when the result is
    // limit-truncated — an honest partial view instead of a silent sample-as-population
    // narration.
    breakdownDimensions: ['document.level', 'document.logsource.product'],
  },
};
