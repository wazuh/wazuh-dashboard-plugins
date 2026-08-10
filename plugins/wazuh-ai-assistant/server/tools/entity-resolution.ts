/**
 * No-silent-entity-substitution disclosure (issue #8920 item 6): the server has no way to see the
 * user's ORIGINAL wording -- only the agent-name string(s) the model already resolved and passed
 * as tool-call params (see `AGENT_NAME_PARAM_KEYS`). So it cannot detect "the model silently
 * substituted a different host" directly; the honest, deterministic guarantee it CAN give is a
 * near-miss disclosure computed from the index's own population of agent names, using a
 * normalization relation that catches the zero-padding/separator/case variance which lets a
 * typo'd or reformatted name silently match nothing, or silently match a DIFFERENT real host,
 * without either being explained. The relation errs toward DISCLOSING: two multi-numbered names
 * that differ only in where their separators fall ("node-1-23" vs "node-12-3") normalize equal
 * and would be flagged against each other -- a rare, harmless extra "did you mean" suggestion --
 * but it never suppresses a genuine sibling, and disclosure is the failure-safe direction for
 * this class. See executor.ts's integration for how this is wired into the tool-call chokepoint
 * and how privacy mode is preserved.
 */

/**
 * Lowercases, splits on `[-_.]` separators, canonicalizes each segment's digit runs to their
 * plain numeric value (drops leading zeros), and joins with no delimiter -- e.g. "wazuh-aio-05"
 * and "wazuh-aio-5" both normalize to "wazuhaio5" (same host, different zero-padding), while
 * "web-prod-01" and "web-prod-02" normalize to "webprod1"/"webprod2" respectively (genuinely
 * distinct hosts -- the digits themselves differ, not just their padding). NOTE the known
 * conflation this join accepts deliberately: because separators are dropped AFTER per-segment
 * digit canonicalization, differently-split multi-number names can normalize equal
 * ("node-1-23" and "node-12-3" are both "node123"). That direction only ever ADDS a candidate
 * to the disclosure (see the module header) -- it can never hide one.
 */
export function normalizeAgentName(name: string): string {
  return name
    .toLowerCase()
    .split(/[-_.]+/)
    .map(segment => segment.replace(/\d+/g, digits => String(Number(digits))))
    .join('');
}

/**
 * The registry's agent-name-shaped tool parameters, in one place: `agent_name` (single string --
 * search_findings_by_agent, get_events_by_agent, get_agent_inventory), `agent_names` (array --
 * search_findings_by_multiple_agents), and `agent_identifier` (get_vulnerabilities_by_agent's
 * name-or-id `multi_match` param, which takes the human name in exactly the reported scenario:
 * "what's going on with wazuh-aio-05?" resolves its vulnerability leg through this tool).
 * `entity-resolution.test.ts`'s registry sweep asserts every declared param whose name LOOKS
 * agent-name-shaped is listed here, so a future tool cannot add one that this disclosure
 * silently never reads.
 */
export const AGENT_NAME_PARAM_KEYS = [
  'agent_name',
  'agent_names',
  'agent_identifier',
] as const;

/**
 * Builds the Lucene-regexp `include` pattern for the near-miss probe's terms aggregation (see
 * executor.ts's `appendEntityNearMissHint`): a pattern matching every indexed name that COULD
 * normalize equal to one of the requested names. This is what makes the probe population-
 * independent -- a plain top-N terms aggregation only ever sees the N busiest agent names, so on
 * any fleet larger than the agg size a QUIET sibling (the reported instance's wazuh-aio-05 has a
 * single finding) simply never appears in the buckets and the disclosure silently no-ops.
 *
 * The pattern deliberately OVER-matches (it allows `0*` before every digit and `[-_.]*` between
 * every character, not only at the original run/segment boundaries): every true sibling matches,
 * a handful of non-siblings may also match, and `findNearMissSiblings` then applies the EXACT
 * `normalizeAgentName` equality to whatever comes back -- so over-matching costs a few extra
 * buckets, never a wrong disclosure. Lucene regexp syntax (OpenSearch `terms.include`): anchored
 * by default, no case-insensitivity flag, so letters are expanded to `[aA]` classes; characters
 * outside `[a-z0-9]` are escaped literally.
 */
export function buildNearMissIncludePattern(
  requestedNames: string[],
): string | undefined {
  const patterns = requestedNames.map(name => {
    const normalized = normalizeAgentName(name);
    if (normalized.length === 0) {
      return undefined;
    }
    const parts: string[] = [];
    for (const char of normalized) {
      if (/[a-z]/.test(char)) {
        parts.push(`[${char}${char.toUpperCase()}]`);
      } else if (/[0-9]/.test(char)) {
        parts.push(`0*${char}`);
      } else {
        parts.push(`\\${char}`);
      }
    }
    return parts.join('[-_.]*');
  });
  const valid = patterns.filter((p): p is string => !!p);
  if (valid.length === 0) {
    return undefined;
  }
  return valid.join('|');
}

export interface AgentNearMiss {
  /** The exact string the tool call was filtered by. */
  requested: string;
  /** Distinct indexed agent names (verbatim, not normalized) whose normalized form matches
   * `requested`'s, excluding `requested` itself. */
  siblings: string[];
}

/**
 * For each requested agent name, finds every DISTINCT indexed name (drawn from a population terms
 * aggregation over the same index -- see executor.ts's call site) whose normalized form
 * (`normalizeAgentName`) matches the requested name's, but whose raw string differs. Fires
 * identically whether the requested name has zero exact matches in the index (a typo/padding
 * mismatch) or some matches with data (a near-miss with a DIFFERENT real host that also has
 * data) -- either way the right disclosure is the same: "you may have meant one of these
 * instead", never a silent substitution of one host for another.
 */
export function findNearMissSiblings(
  requestedNames: string[],
  indexedNames: string[],
): AgentNearMiss[] {
  const results: AgentNearMiss[] = [];
  for (const requested of requestedNames) {
    const requestedNormalized = normalizeAgentName(requested);
    const siblings = [
      ...new Set(
        indexedNames.filter(
          indexed =>
            indexed !== requested &&
            normalizeAgentName(indexed) === requestedNormalized,
        ),
      ),
    ];
    if (siblings.length > 0) {
      results.push({ requested, siblings });
    }
  }
  return results;
}

/**
 * Reads every agent-name param shape a tool's validated params can carry (see
 * `AGENT_NAME_PARAM_KEYS`): a single string (`agent_name`, or get_vulnerabilities_by_agent's
 * `agent_identifier` -- which may also hold a numeric agent ID, harmless here: an ID's
 * normalized form only ever matches other zero-padding variants of itself, so a near-miss
 * disclosure on it is still truthful) or a string array (`agent_names`). Deduped,
 * order-preserving. Empty for a call that named no agent at all (e.g. get_events_by_agent's
 * "all agents" mode, where `agent_name` is optional and omitted) -- there is nothing to
 * disclose a near-miss against, and executor.ts's integration skips the extra query entirely
 * in that case.
 */
export function extractRequestedAgentNames(
  params: Record<string, unknown>,
): string[] {
  const names = new Set<string>();
  for (const key of AGENT_NAME_PARAM_KEYS) {
    const value = params[key];
    if (typeof value === 'string' && value.trim() !== '') {
      names.add(value);
    } else if (Array.isArray(value)) {
      for (const name of value) {
        if (typeof name === 'string' && name.trim() !== '') {
          names.add(name);
        }
      }
    }
  }
  return [...names];
}
