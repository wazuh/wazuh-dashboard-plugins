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
 * `buildRequest` with representative params, then walk the built body for any `terms` aggregation
 * that also declares a `top_hits` sub-aggregation. Nothing is exempt by default — a tool is only
 * excused via `SAMPLED_LABEL_ONE_TO_ONE`, a written, per-tool justification that its bucket key
 * genuinely determines the sampled label (verified against a live stack, not merely asserted).
 *
 * CRITICAL COMPOUNDING PROPERTY: this test runs registry-wide, driven from `listToolDefinitions()`
 * — a tool that does not exist on this base branch (e.g. #8909's `get_top_agents`, an unmerged
 * agent-name-sampling `terms`+`top_hits` aggregation) will, the moment it is registered, be walked
 * by this SAME test and fail unless it either adds its own cardinality guard or is added to
 * `SAMPLED_LABEL_ONE_TO_ONE` with a real justification. The class stays closed for tools that do
 * not exist yet.
 */

/** Tool-scoped justification that a bucket key genuinely determines its sampled top_hits label
 * (the "key determines the label" half of the adopted rule) — the ONLY escape from needing a
 * cardinality spread guard. Each entry must record a real, verified reason, not a rubber stamp:
 * adding a tool here without one is exactly the failure mode this test exists to prevent. */
const SAMPLED_LABEL_ONE_TO_ONE: Record<string, string> = {
  // get-sca-results.ts: `policy.id` -> `policy.name` is 1:1 BY SCA DESIGN -- one Wazuh SCA policy
  // document (e.g. "cis_debian10") has exactly one name, unlike a rule id (reused across
  // differently-worded rule text) or a MITRE technique id (which maps to more than one tactic).
  // Live-verified against the wazuh-states-sca mapping (see get-sca-results.ts's own doc comment).
  get_sca_results: 'policy.id -> policy.name is 1:1 by SCA design.',
};

/**
 * Minimal valid value for one declared param — same purpose as agg-size-coverage.test.ts's own
 * `sampleValue` (kept local rather than importing a private helper from that unrelated test file):
 * get far enough into `buildRequest` to produce a body, satisfying the validators several tools run
 * on their inputs. Ordinary values, not the absurd ones agg-size-coverage.test.ts deliberately
 * uses — this test does not care about size clamping, only aggregation SHAPE.
 */
function sampleValue(name: string, prop: JsonSchemaProperty): unknown {
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
  /** Field names covered by a sibling `cardinality` sub-aggregation at the SAME level as the
   * `top_hits` sub-agg(s). */
  cardinalityGuardedFields: Set<string>;
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

    if ('terms' in aggDef && children) {
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

        const cardinalityGuardedFields = new Set<string>();
        for (const child of Object.values(children)) {
          if (!child || typeof child !== 'object') {
            continue;
          }
          const cardinality = (child as { cardinality?: { field?: unknown } })
            .cardinality;
          if (cardinality && typeof cardinality.field === 'string') {
            cardinalityGuardedFields.add(cardinality.field);
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

    if (SAMPLED_LABEL_ONE_TO_ONE[def.spec.name]) {
      continue;
    }

    // Visible tableSpec column fields — a `deriveColumns` tool (search_wazuh_data) has no static
    // tableSpec (columns are chosen per-response, see server/tools/types.ts's `deriveColumns` doc
    // comment) and is out of this test's scope, same exclusion field-policy-coverage.test.ts makes
    // for the same reason.
    if (def.deriveColumns) {
      continue;
    }
    const visibleColumnFields = def.tableSpec.columns.map(
      column => column.field,
    );

    for (const occurrence of found) {
      const displayedSampledFields = (
        occurrence.sampledFields ?? visibleColumnFields
      ).filter(field => visibleColumnFields.includes(field));

      const unguarded = displayedSampledFields.filter(
        field => !occurrence.cardinalityGuardedFields.has(field),
      );
      if (unguarded.length > 0) {
        failures.push(
          `${def.spec.name} (${occurrence.path}): displayed sampled field(s) [` +
            `${unguarded.join(', ')}] have no sibling cardinality guard and no ` +
            'SAMPLED_LABEL_ONE_TO_ONE justification',
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

test('SAMPLED_LABEL_ONE_TO_ONE sanity: every justified tool name is still a registered tool', () => {
  // Guards against a stale entry surviving a tool rename/removal, silently exempting nothing.
  const names = new Set(listToolDefinitions().map(def => def.spec.name));
  for (const toolName of Object.keys(SAMPLED_LABEL_ONE_TO_ONE)) {
    assert.ok(names.has(toolName), `${toolName} is not a registered tool`);
  }
});
