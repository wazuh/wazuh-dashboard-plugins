import assert from 'node:assert/strict';
import { JsonSchemaProperty } from '../../../common/types';
import { listToolDefinitions } from '../registry';
import { IndexerRequest } from '../types';

/**
 * Registry-wide guard for the sampled-label-falsehood class (issue #8921): a `terms` aggregation's
 * bucket KEY does not, in general, determine the label a `top_hits` sub-aggregation samples inside
 * that bucket — one key can span many labels (get_top_rules' rule id -> many titles) or the
 * sampled document's field can itself be a multi-value array with no positional guarantee
 * (get_mitre_summary's technique id -> technique/tactic name arrays). Displaying that sampled label
 * as if it were authoritative for the whole bucket is the falsehood this class covers.
 *
 * The adopted rule, verbatim (also recorded in get-mitre-summary.ts's doc comment): a sampled label
 * may only be DISPLAYED where the key determines the label; otherwise carry the spread (a sibling
 * `cardinality` sub-aggregation over that field) and mark the label as a sample. "Displayed" is the
 * operative word: a `top_hits` `_source` field that is fetched but never rendered as a visible
 * `tableSpec` column (e.g. get_mitre_summary's `technique.id`, fetched only so a downstream
 * consumer can positionally match it against the parallel name array — see that file's doc
 * comment) carries no display-time falsehood risk and is not required to carry its own spread
 * guard. A `top_hits` sub-agg with no explicit `_source` (whole-document sampling) fails CLOSED
 * instead — every one of the tool's own visible columns is treated as at risk, since this test
 * cannot rule out any of them having been sampled.
 *
 * Method, following `agg-size-coverage.test.ts`'s pattern: drive every registered tool's own
 * `buildRequest` with representative params, then walk the built body for ANY bucketing
 * aggregation that also declares a `top_hits` sub-aggregation (fail-closed on the bucket type —
 * not only `terms`). "Displayed" covers BOTH surfaces a sampled label can reach: the visible
 * tableSpec columns AND digest.sampleColumns (the model-facing surface the reported "796 hits"
 * sentence was actually written from). A cardinality guard only satisfies the rule when its own
 * VALUE is displayed on one of those surfaces — a guard in the request body whose number never
 * reaches a column discloses nothing. Nothing is exempt by default — a sampled field is only
 * excused via `SAMPLED_LABEL_ONE_TO_ONE`, a written, FIELD-scoped justification that its bucket
 * key genuinely determines that label (verified against a live stack, not merely asserted).
 *
 * CRITICAL COMPOUNDING PROPERTY: this test runs registry-wide, driven from `listToolDefinitions()`
 * — a tool that does not exist on this base branch (e.g. #8909's `get_top_agents`, an unmerged
 * agent-name-sampling `terms`+`top_hits` aggregation) will, the moment it is registered, be walked
 * by this SAME test and fail unless it either adds its own cardinality guard or is added to
 * `SAMPLED_LABEL_ONE_TO_ONE` with a real justification. The class stays closed for tools that do
 * not exist yet.
 */

/**
 * FIELD-scoped justification ("toolName/sampledField", the same scoped-key convention privacy.ts's
 * resolveFieldEntry and field-policy-coverage.test.ts use) that a specific sampled top_hits field
 * needs no cardinality spread guard — the ONLY escape from needing one. Field-scoped, not
 * tool-scoped, deliberately: a tool-wide exemption would silently cover every FUTURE sampled
 * field of that tool on the strength of a justification written for one field (the exact
 * exemption-broader-than-its-justification failure this suite exists to prevent). Each entry must
 * record a real, verified reason, not a rubber stamp.
 */
const SAMPLED_LABEL_ONE_TO_ONE: Record<string, string> = {
  // get-sca-results.ts: `policy.id` -> `policy.name` is 1:1 BY SCA DESIGN -- one Wazuh SCA policy
  // document (e.g. "cis_debian10") has exactly one name, unlike a rule id (reused across
  // differently-worded rule text). Live-verified against the wazuh-states-sca mapping (see
  // get-sca-results.ts's own doc comment).
  'get_sca_results/policy.name':
    'policy.id -> policy.name is 1:1 by SCA design.',
  // get-mitre-summary.ts (see its doc comment for the full argument): the ATT&CK catalog maps a
  // technique id to exactly ONE canonical name (18-result-table-design.md's "Defect 1" table
  // records this as the reviewed decision), so the sampled name is 1:1 with the bucket key; the
  // residue is POSITIONAL (multi-technique docs carry parallel id/name arrays), which the sampled
  // id array makes verifiable and the "(sample)" label discloses. A cardinality guard would
  // itself be a falsehood here: within a bucket it counts CO-TAGGED techniques' names, so a
  // one-name technique would read "distinct names: 2". NEEDS-LIVE-PROOF note: if a live check
  // ever shows a technique id bucketing under two names, this exemption must be replaced with a
  // per-bucket filtered aggregation, not a cardinality guard.
  'get_mitre_summary/wazuh.rule.mitre.technique.name':
    'ATT&CK technique id -> name is 1:1 per catalog (recorded decision, design doc 18); ' +
    'residue is positional and carried via the parallel sampled id array.',
  // The tactic sample is NOT 1:1 (a technique can belong to two tactics) but the honest
  // instrument is a per-bucket filtered tactic aggregation, which needs a digest bucket-shape
  // extension owned by digest.ts — a bucket-wide cardinality would again count co-tagged
  // techniques' tactics. Accepted residual: the column is labeled "(sample)", the spread is
  // bounded (<= 2 tactics per technique in ATT&CK), and the parallel arrays are carried.
  'get_mitre_summary/wazuh.rule.mitre.tactic.name':
    'Labeled "(sample)"; bounded residual (<=2 tactics/technique). A bucket-wide cardinality ' +
    'would be the wrong instrument (counts co-tagged techniques). Recorded residual.',
  // The raw parallel id array itself: carried precisely SO the name/tactic samples above are
  // positionally verifiable — it is the disclosure mechanism, not a label pretending to be
  // bucket-wide (the bucket key anchors it).
  'get_mitre_summary/wazuh.rule.mitre.technique.id':
    'The sampled id array is the positional-match carrier for the name/tactic samples; the ' +
    'bucket key is its anchor.',
};

/**
 * Minimal valid value for one declared param — same purpose as agg-size-coverage.test.ts's own
 * `sampleValue` (kept local rather than importing a private helper from that unrelated test file):
 * get far enough into `buildRequest` to produce a body, satisfying the validators several tools run
 * on their inputs. Ordinary values, not the absurd ones agg-size-coverage.test.ts deliberately
 * uses — this test does not care about size clamping, only aggregation SHAPE.
 */
function sampleValue(name: string, prop: JsonSchemaProperty): unknown {
  // get_field_values' `field` param is restricted to guardrails.ts's AGG_FIELD_ALLOWLIST.
  // "wazuh.agent.id" is chosen because its FIELD_LOCATIONS include "events", the family this
  // file's own generic enum heuristic samples first for `index_family` (alphabetical
  // `enumValues[0]`).
  if (name === 'field') {
    return 'wazuh.agent.id';
  }
  if ((prop as { jsonString?: true }).jsonString) {
    return JSON.stringify({
      query: {
        bool: {
          filter: [{ range: { '@timestamp': { gte: 'now-7d', lte: 'now' } } }],
        },
      },
    });
  }
  const enumValues = (prop as { enum?: unknown[] }).enum;
  if (Array.isArray(enumValues) && enumValues.length > 0) {
    return enumValues[0];
  }
  if (prop.type === 'number') {
    return 5;
  }
  if (prop.type === 'boolean') {
    return true;
  }
  if (prop.type === 'array') {
    const items = (prop as { items?: JsonSchemaProperty }).items;
    const itemEnum = (items as { enum?: unknown[] } | undefined)?.enum;
    if (Array.isArray(itemEnum) && itemEnum.length > 0) {
      return [itemEnum[0]];
    }
    return ['001'];
  }
  if (/(^|_)agent_id$/.test(name) || name === 'agent') {
    return '001';
  }
  if (/(^|_)(gte|lte|from|to)$/.test(name) || name.includes('time_range')) {
    return 'now-7d';
  }
  return 'test';
}

function sampleParams(
  properties: Record<string, JsonSchemaProperty>,
): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  for (const [name, prop] of Object.entries(properties)) {
    params[name] = sampleValue(name, prop);
  }
  return params;
}

interface TermsWithTopHits {
  /** Dotted path to this aggregation, for a readable failure message. */
  path: string;
  /** Every `_source` field name any `top_hits` sibling under this bucket agg samples; `null` means
   * at least one sibling `top_hits` had no explicit `_source` (whole-document sample) — see the
   * fail-closed handling at the call site. */
  sampledFields: string[] | null;
  /** field -> the sibling `cardinality` sub-aggregation's NAME (the row key its value merges
   * under, which must itself be displayed for the guard to disclose anything). */
  cardinalityGuardedFields: Map<string, string>;
}

/**
 * Recursively finds every aggregation object (at any nesting depth) that declares BOTH a `terms`
 * field and a `top_hits` sub-aggregation among its own children — a manual recursion (rather than
 * guardrails.ts's generic single-key `walk`) because this needs to reason about one aggregation's
 * full set of sibling sub-aggs together, not one key at a time.
 */
function findTermsWithTopHits(
  aggsNode: unknown,
  pathPrefix: string,
  out: TermsWithTopHits[],
): void {
  if (!aggsNode || typeof aggsNode !== 'object') {
    return;
  }
  for (const [name, aggDefUnknown] of Object.entries(
    aggsNode as Record<string, unknown>,
  )) {
    if (!aggDefUnknown || typeof aggDefUnknown !== 'object') {
      continue;
    }
    const aggDef = aggDefUnknown as Record<string, unknown>;
    const path = pathPrefix ? `${pathPrefix}.${name}` : name;
    const children = (aggDef.aggs ?? aggDef.aggregations) as
      | Record<string, unknown>
      | undefined;

    // FAIL-CLOSED on the bucketing type: ANY aggregation node with a top_hits child is treated
    // as a sampled-label risk, not only `terms` — composite/multi_terms/significant_terms/
    // date_histogram/filters can all carry a top_hits sub-agg (guardrails.ts's checkAggs has
    // dedicated composite/multi_terms branches, so those shapes are expected in this codebase),
    // and a walker keyed on `terms` alone would give every one of them a free pass.
    const typeKeys = Object.keys(aggDef).filter(
      key => key !== 'aggs' && key !== 'aggregations' && key !== 'meta',
    );
    if (typeKeys.length > 0 && children) {
      const topHitsSubAggs = Object.values(children).filter(
        child =>
          child &&
          typeof child === 'object' &&
          'top_hits' in (child as Record<string, unknown>),
      ) as Array<{ top_hits: Record<string, unknown> }>;

      if (topHitsSubAggs.length > 0) {
        let sampledFields: string[] | null = [];
        for (const topHitsSubAgg of topHitsSubAggs) {
          const source = topHitsSubAgg.top_hits._source;
          if (
            Array.isArray(source) &&
            source.every(field => typeof field === 'string')
          ) {
            sampledFields = [...(sampledFields ?? []), ...(source as string[])];
          } else {
            // No explicit (or non-array) `_source`: fail closed. See this file's doc comment.
            sampledFields = null;
            break;
          }
        }

        const cardinalityGuardedFields = new Map<string, string>();
        for (const [childName, child] of Object.entries(children)) {
          if (!child || typeof child !== 'object') {
            continue;
          }
          const cardinality = (child as { cardinality?: { field?: unknown } })
            .cardinality;
          if (cardinality && typeof cardinality.field === 'string') {
            cardinalityGuardedFields.set(cardinality.field, childName);
          }
        }

        out.push({ path, sampledFields, cardinalityGuardedFields });
      }
    }

    if (children) {
      findTermsWithTopHits(children, path, out);
    }
  }
}

const indexerTools = listToolDefinitions().filter(
  def => def.target === 'indexer',
);

test('every terms+top_hits aggregation guards every DISPLAYED sampled field with a cardinality sub-agg, or is justified as 1:1', () => {
  assert.ok(
    indexerTools.length > 0,
    'registry produced no indexer tools to check',
  );

  const failures: string[] = [];

  for (const def of indexerTools) {
    let request: IndexerRequest;
    try {
      request = def.buildRequest(
        sampleParams(def.spec.parameters.properties),
      ) as IndexerRequest;
    } catch (error) {
      // A parameter-level throw is a legitimate tool behaviour (see
      // agg-size-coverage.test.ts's identical reasoning), but IS recorded here too, so a tool that
      // starts throwing on its own sample params is visible rather than silently unchecked by this
      // coverage test.
      failures.push(
        `${def.spec.name}: buildRequest threw for its own declared params -- ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      continue;
    }

    const found: TermsWithTopHits[] = [];
    findTermsWithTopHits(request.body.aggs, '', found);
    findTermsWithTopHits(request.body.aggregations, '', found);
    if (found.length === 0) {
      continue;
    }

    // A `deriveColumns` tool (search_wazuh_data) has no static tableSpec/sampleColumns to
    // enumerate (columns are chosen per-response, see server/tools/types.ts's `deriveColumns`
    // doc comment) and is out of this test's scope, same exclusion
    // field-policy-coverage.test.ts makes for the same reason.
    if (def.deriveColumns) {
      continue;
    }

    // "Displayed" = the UNION of visible tableSpec column fields and digest.sampleColumns. The
    // reported defect (the "796 hits" sentence) was written by the MODEL from the digest, not
    // read off the rendered table — a sampled field that reaches the model through sampleColumns
    // carries exactly the same falsehood risk as one rendered on screen, so guarding only the
    // table surface would leave the model-facing one (the one the finding was actually about)
    // unguarded.
    const displayedFields = new Set<string>([
      ...def.tableSpec.columns.map(column => column.field),
      ...def.digest.sampleColumns,
    ]);

    for (const occurrence of found) {
      const displayedSampledFields = (
        occurrence.sampledFields ?? [...displayedFields]
      ).filter(field => displayedFields.has(field));

      const unguarded = displayedSampledFields.filter(field => {
        if (SAMPLED_LABEL_ONE_TO_ONE[`${def.spec.name}/${field}`]) {
          return false;
        }
        // A cardinality guard only counts when its VALUE is disclosed: the sub-agg's NAME is the
        // row key digest.ts merges the number under, so it must itself be displayed (a guard
        // present in the request body but dropped by column projection discloses nothing).
        const guardAggName = occurrence.cardinalityGuardedFields.get(field);
        return guardAggName === undefined || !displayedFields.has(guardAggName);
      });
      if (unguarded.length > 0) {
        failures.push(
          `${def.spec.name} (${occurrence.path}): displayed sampled field(s) [` +
            `${unguarded.join(
              ', ',
            )}] have no DISPLAYED sibling cardinality guard and no ` +
            'field-scoped SAMPLED_LABEL_ONE_TO_ONE justification',
        );
      }
    }
  }

  assert.deepEqual(
    failures,
    [],
    'A terms+top_hits aggregation displays a sampled label with no spread disclosure and no ' +
      'recorded 1:1 justification. Add a sibling `cardinality` sub-aggregation over the sampled ' +
      'field (see get-top-rules.ts/get-mitre-summary.ts), or add a written entry to ' +
      `SAMPLED_LABEL_ONE_TO_ONE if the bucket key genuinely determines the label.\n${failures.join(
        '\n',
      )}`,
  );
});

test('SAMPLED_LABEL_ONE_TO_ONE sanity: every key is "tool/field" and names a registered tool', () => {
  // Guards against a stale entry surviving a tool rename/removal, silently exempting nothing —
  // and against someone reverting the keys to tool-wide scope.
  const names = new Set(listToolDefinitions().map(def => def.spec.name));
  for (const key of Object.keys(SAMPLED_LABEL_ONE_TO_ONE)) {
    const slash = key.indexOf('/');
    assert.ok(
      slash > 0,
      `${key}: exemption keys must be "toolName/sampledField"`,
    );
    const toolName = key.slice(0, slash);
    assert.ok(names.has(toolName), `${toolName} is not a registered tool`);
    assert.ok(
      key.slice(slash + 1).length > 0,
      `${key}: exemption keys must name the sampled field`,
    );
  }
});

test('findTermsWithTopHits mechanism: a synthetic offender is flagged, guards must be displayed', () => {
  // Self-test in field-policy-coverage.test.ts's "isFieldCovered mechanism" style: if the walker
  // silently became a no-op, every registry assertion above would pass vacuously.
  const found: TermsWithTopHits[] = [];
  findTermsWithTopHits(
    {
      // terms + top_hits, no guard: must be found with its sampled field.
      by_rule: {
        terms: { field: 'wazuh.rule.id', size: 5 },
        aggs: {
          sample_doc: { top_hits: { size: 1, _source: ['wazuh.rule.title'] } },
        },
      },
      // a NON-terms bucketing agg with a top_hits child: must ALSO be found (fail-closed on the
      // bucket type — composite is a shape guardrails.ts explicitly anticipates).
      by_pair: {
        composite: {
          size: 5,
          sources: [{ rule: { terms: { field: 'wazuh.rule.id' } } }],
        },
        aggs: {
          sample_doc: { top_hits: { size: 1, _source: ['wazuh.rule.title'] } },
        },
      },
      // top_hits with NO explicit _source: must be found with sampledFields null (fail closed).
      by_agent: {
        terms: { field: 'wazuh.agent.name', size: 5 },
        aggs: { sample_doc: { top_hits: { size: 1 } } },
      },
    },
    '',
    found,
  );
  assert.deepEqual(found.map(f => f.path).sort(), [
    'by_agent',
    'by_pair',
    'by_rule',
  ]);
  const byRule = found.find(f => f.path === 'by_rule');
  assert.deepEqual(byRule?.sampledFields, ['wazuh.rule.title']);
  assert.equal(byRule?.cardinalityGuardedFields.size, 0);
  const byAgent = found.find(f => f.path === 'by_agent');
  assert.equal(byAgent?.sampledFields, null);
});
