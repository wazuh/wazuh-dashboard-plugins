/**
 * No-silent-entity-substitution disclosure (issue #8920 item 6): the server has no way to see the
 * user's ORIGINAL wording -- only the `agent_name`/`agent_names` string(s) the model already
 * resolved and passed as tool-call params. So it cannot detect "the model silently substituted a
 * different host" directly; the honest, deterministic guarantee it CAN give is a near-miss
 * disclosure computed from the index's own population of agent names, using a normalization
 * relation narrow enough that it provably never flags two genuinely distinct hosts
 * (`web-prod-01` vs `web-prod-02`) while still catching the zero-padding/separator/case variance
 * that lets a typo'd or reformatted name silently match nothing, or silently match a DIFFERENT
 * real host, without
 * either being explained. See executor.ts's integration for how this is wired into the tool-call
 * chokepoint and how privacy mode is preserved.
 */

/**
 * Splits a name into `[-_.]`-delimited segments, lowercases each, and canonicalizes each segment's
 * digit run to its plain numeric value (drops leading zeros) -- e.g. "wazuh-aio-05" and
 * "wazuh-aio-5" both normalize to "wazuhaio5" (same host, different zero-padding), while
 * "web-prod-01" and "web-prod-02" normalize to "webprod1"/"webprod2" respectively (genuinely
 * distinct hosts -- the digits themselves differ, not just their padding). Digit canonicalization
 * runs PER SEGMENT, before segments are joined with no delimiter -- canonicalizing after joining
 * would let two separately-numbered segments (e.g. "web-01-02") collapse together with a
 * differently-split name ("web-1-02") that a per-segment scheme correctly keeps apart.
 */
export function normalizeAgentName(name: string): string {
  return name
    .toLowerCase()
    .split(/[-_.]+/)
    .map(segment => segment.replace(/\d+/g, digits => String(Number(digits))))
    .join('');
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
 * Reads whichever of the two agent-name param shapes a tool's validated params carry: a single
 * `agent_name` string (search_findings_by_agent, get_events_by_agent, get_agent_inventory -- all
 * confirmed on the base registry) or an `agent_names` array (search_findings_by_multiple_agents).
 * Deduped, order-preserving. Empty for a call that named no agent at all (e.g.
 * get_events_by_agent's "all agents" mode, where `agent_name` is optional and omitted) -- there
 * is nothing to disclose a near-miss against, and executor.ts's integration skips the extra
 * query entirely in that case.
 */
export function extractRequestedAgentNames(
  params: Record<string, unknown>,
): string[] {
  const names = new Set<string>();
  if (
    typeof params.agent_name === 'string' &&
    params.agent_name.trim() !== ''
  ) {
    names.add(params.agent_name);
  }
  const agentNames = params.agent_names;
  if (Array.isArray(agentNames)) {
    for (const name of agentNames) {
      if (typeof name === 'string' && name.trim() !== '') {
        names.add(name);
      }
    }
  }
  return [...names];
}
