/**
 * MITRE sub-technique rollup, as a CHOKEPOINT transform: a bare parent technique id ("T1059")
 * filtered with a plain `term` matches only its own exact bucket and silently excludes every
 * "T1059.NNN" sub-technique finding — MITRE ATT&CK itself treats a parent technique as covering
 * its children, so "how many T1059 findings" is undercounted.
 *
 * get-mitre-findings.ts builds the rolled-up shape itself (its own doc comment explains the
 * shape), but a tool-local fix leaves the same class open on every OTHER path that can filter on
 * a technique-id field — most importantly the `search_wazuh_data` escape hatch, whose
 * hand-written `{term: {"wazuh.rule.mitre.technique.id": "T1059"}}` is executed verbatim. This
 * transform therefore runs in executor.ts on the EXECUTED (post-`applySafetyValves`) body of
 * every indexer request, so typed tools and the escape hatch share one deterministic guarantee
 * with no per-tool opt-in. It is idempotent: the rolled shape below contains a bare-parent `term`
 * as its own first `should` member, so a naive second pass would re-roll it and nest one `bool`
 * inside another. Idempotence comes from `isRolledUpClause` recognizing that exact emitted shape
 * and leaving it alone. It matters because a typed tool (get-mitre-findings.ts) may already have
 * rolled up before this chokepoint runs on the executed body.
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

/** The single field/value pair of a one-key clause of type `clauseType`, or undefined if `node` is
 * not that shape. Shared by the rolled-shape recognizer below. */
function singleFieldClause(
  node: unknown,
  clauseType: 'term' | 'prefix',
): { field: string; value: string } | undefined {
  if (!node || typeof node !== 'object' || Array.isArray(node)) {
    return undefined;
  }
  const record = node as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length !== 1 || keys[0] !== clauseType) {
    return undefined;
  }
  const body = record[clauseType];
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return undefined;
  }
  const entries = Object.entries(body as Record<string, unknown>);
  if (entries.length !== 1) {
    return undefined;
  }
  const [field, fieldSpec] = entries[0];
  const value = termValue(fieldSpec);
  return typeof value === 'string' ? { field, value } : undefined;
}

/**
 * True for the EXACT shape `rolledUpClause` emits. Needed because that shape deliberately contains
 * a bare-parent `term` as its first `should` member: without this check the walker re-rolls its own
 * output and nests one `bool` inside another on a second pass -- an already-rolled shape DOES carry
 * a bare `term` on a parent id, which is why `technique-rollup-coverage.test.ts` pins the
 * twice-applied case. A second pass returns the node untouched, and the walker does not
 * descend into it — the inner clauses are this function's own output, never a caller's filter.
 */
function isRolledUpClause(record: Record<string, unknown>): boolean {
  const keys = Object.keys(record);
  if (keys.length !== 1 || keys[0] !== 'bool') {
    return false;
  }
  const bool = record.bool;
  if (!bool || typeof bool !== 'object' || Array.isArray(bool)) {
    return false;
  }
  const boolRecord = bool as Record<string, unknown>;
  const boolKeys = Object.keys(boolRecord).sort();
  if (
    boolKeys.length !== 2 ||
    boolKeys[0] !== 'minimum_should_match' ||
    boolKeys[1] !== 'should' ||
    boolRecord.minimum_should_match !== 1 ||
    !Array.isArray(boolRecord.should) ||
    boolRecord.should.length !== 2
  ) {
    return false;
  }
  const exact = singleFieldClause(boolRecord.should[0], 'term');
  const children = singleFieldClause(boolRecord.should[1], 'prefix');
  return (
    exact !== undefined &&
    children !== undefined &&
    exact.field === children.field &&
    TECHNIQUE_ID_FIELD_RE.test(exact.field) &&
    children.value === `${exact.value}.`
  );
}

function transformNode(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.map(transformNode);
  }
  if (!node || typeof node !== 'object') {
    return node;
  }
  const record = node as Record<string, unknown>;
  if (isRolledUpClause(record)) {
    return record;
  }
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
