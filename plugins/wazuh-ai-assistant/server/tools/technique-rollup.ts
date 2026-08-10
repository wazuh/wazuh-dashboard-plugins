/**
 * MITRE sub-technique rollup, as a CHOKEPOINT transform (issue #8920 item 2): a bare parent
 * technique id ("T1059") filtered with a plain `term` matches only its own exact bucket and
 * silently excludes every "T1059.NNN" sub-technique finding — MITRE ATT&CK itself treats a
 * parent technique as covering its children, so "how many T1059 findings" is undercounted (the
 * reported instance: 3 exact-parent docs shown, 9 T1059.001 docs hidden).
 *
 * get-mitre-findings.ts builds the rolled-up shape itself (its own doc comment explains the
 * shape), but a tool-local fix leaves the same class open on every OTHER path that can filter on
 * a technique-id field — most importantly the `search_wazuh_data` escape hatch, whose
 * hand-written `{term: {"wazuh.rule.mitre.technique.id": "T1059"}}` is executed verbatim. This
 * transform therefore runs in executor.ts on the EXECUTED (post-`applySafetyValves`) body of
 * every indexer request, so typed tools and the escape hatch share one deterministic guarantee
 * with no per-tool opt-in. It is idempotent: an already-rolled shape carries no bare `term` on a
 * parent id, so a second pass changes nothing.
 *
 * What it rewrites: any single-key `{term: {<field ending in "technique.id">: "T<digits>"}}`
 * clause, anywhere in `body.query`, becomes
 * `{bool: {minimum_should_match: 1, should: [{term: {field: id}}, {prefix: {field: "id."}}]}}`.
 * The id is UPPERCASED first (MITRE ids are indexed uppercase and `term`/`prefix` on a keyword
 * field are case-sensitive — "t1059" would otherwise match nothing); a dotted sub-technique id
 * is already maximally specific, so it is only case-normalized, never broadened. Aggregations
 * are never touched — a terms AGG on the technique-id field buckets per exact id, which is the
 * DISCLOSURE side of this class (see executor.ts's sub-technique hint), not a filter to broaden.
 *
 * Safety: this only ever WIDENS a technique-id filter to the sub-techniques of the same parent —
 * it cannot reach new indices, new fields, or rows outside what a `prefix` on the same
 * allowlisted keyword field matches, and `prefix` is already guardrail-legal on this field
 * (get-sca-checks.ts's precedent; the field is on AGG_FIELD_ALLOWLIST).
 */

/** Field paths a technique-id filter could target — suffix match, same rationale as
 * technique-rollup-coverage.test.ts's TECHNIQUE_ID_FIELD_RE. */
const TECHNIQUE_ID_FIELD_RE = /technique\.id$/i;
/** Bare parent technique id — no sub-technique dot. */
const PARENT_TECHNIQUE_ID_RE = /^T\d+$/i;
/** Dotted sub-technique id — case-normalized but never broadened. */
const SUB_TECHNIQUE_ID_RE = /^T\d+\.\d+$/i;

/** The string value of a `term` clause's field entry — handles both the shorthand
 * (`{field: "T1059"}`) and the object form (`{field: {value: "T1059"}}`). */
function termValue(fieldSpec: unknown): string | undefined {
  if (typeof fieldSpec === 'string') {
    return fieldSpec;
  }
  if (fieldSpec && typeof fieldSpec === 'object' && !Array.isArray(fieldSpec)) {
    const value = (fieldSpec as { value?: unknown }).value;
    return typeof value === 'string' ? value : undefined;
  }
  return undefined;
}

/** The rolled-up replacement for a bare-parent-id `term` clause. */
function rolledUpClause(
  field: string,
  parentId: string,
): Record<string, unknown> {
  return {
    bool: {
      minimum_should_match: 1,
      should: [
        { term: { [field]: parentId } },
        { prefix: { [field]: `${parentId}.` } },
      ],
    },
  };
}

function transformNode(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.map(transformNode);
  }
  if (!node || typeof node !== 'object') {
    return node;
  }
  const record = node as Record<string, unknown>;
  const keys = Object.keys(record);
  // A candidate `term` clause object has exactly one key ("term") whose value maps exactly one
  // field — anything else is not the clause shape this rollup targets and recurses instead.
  if (keys.length === 1 && keys[0] === 'term') {
    const termBody = record.term;
    if (termBody && typeof termBody === 'object' && !Array.isArray(termBody)) {
      const fieldEntries = Object.entries(termBody as Record<string, unknown>);
      if (fieldEntries.length === 1) {
        const [field, fieldSpec] = fieldEntries[0];
        const value = termValue(fieldSpec);
        if (TECHNIQUE_ID_FIELD_RE.test(field) && typeof value === 'string') {
          const normalized = value.toUpperCase();
          if (PARENT_TECHNIQUE_ID_RE.test(normalized)) {
            return rolledUpClause(field, normalized);
          }
          if (SUB_TECHNIQUE_ID_RE.test(normalized) && normalized !== value) {
            // Case-normalize a dotted id in place (keyword term match is case-sensitive), but
            // never broaden it.
            return { term: { [field]: normalized } };
          }
        }
      }
    }
  }
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    out[key] = transformNode(value);
  }
  return out;
}

/**
 * Returns a copy of `body` with every bare-parent technique-id `term` filter inside `body.query`
 * rolled up (see the module header). Aggregations and every other top-level key pass through
 * unchanged by reference; the input is never mutated (same convention as guardrails.ts's
 * `applySafetyValves`).
 */
export function rollUpTechniqueIdFilters(
  body: Record<string, unknown>,
): Record<string, unknown> {
  if (!body.query || typeof body.query !== 'object') {
    return body;
  }
  return { ...body, query: transformNode(body.query) };
}
