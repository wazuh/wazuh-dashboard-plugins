/**
 * Field privacy policy: the shared, ISOMORPHIC half of `server/tools/privacy.ts`.
 *
 * It lives in `common/` (not `server/`) because both sides need the same definitions: `server/` to
 * enforce the policy and `public/` (settings-service.ts, the Settings page) to edit it — and `public/`
 * may not import from `server/`. Everything here is pure — no pseudonym state, no Node/DOM APIs — so
 * the server-side `Pseudonymizer` stays in server/tools/privacy.ts.
 *
 * The three actions all act at ONE boundary — what the AI provider receives — and differ only in how
 * much of the value it gets. Nothing here ever changes the executed query or what the analyst sees:
 * the results table, the answer text (de-pseudonymized by chat.ts's `StreamDepseudonymizer` before
 * it reaches the browser) and the tool-call panel are local surfaces showing the analyst their OWN
 * data, and they always show it in full.
 *
 * - `allow` — the provider receives the real value. Also the default for a field with no entry on a
 *   typed catalog tool (the search_wazuh_data escape hatch flips that default to `anonymize`, see
 *   `applyFieldPolicy`'s `isEscapeHatch`).
 * - `anonymize` — the provider receives a reversible pseudonym (`HOST_1`, `IP_2`) instead.
 * - `never` — the provider receives NOTHING for that field: it is dropped from the digest's samples,
 *   from its aggregation buckets, and from its `columns` schema hint, so not even a pseudonym or the
 *   field's presence reaches the provider. It is still queried and still displayed locally.
 *
 * Two earlier attempts (issue #8821) made `never`/`anonymize` also hide the field from the ANALYST —
 * from the executed query, the results table, or both. Both were wrong for the same reason: the data
 * belongs to the user, who needs to see it in order to act on it, and a field that is not retrieved
 * cannot be displayed at all.
 *
 * Field identity is EXACT on purpose: `wazuh.agent.name` (an Indexer path) and
 * `get_active_agents/name` (a Manager-API tool-scoped name) are different fields and are never
 * merged into one another. A policy entry only ever affects the field it names.
 */

export type FieldPolicyAction = 'allow' | 'anonymize' | 'never';

export type PseudonymKind = 'HOST' | 'IP' | 'USER' | 'URL' | 'VAL';

export interface FieldPolicyEntry {
  /** Either a plain digest field path ("wazuh.agent.name") or a tool-scoped form
   * ("get_active_agents/name") for Manager-API tools whose digest fields are bare, generic names
   * ("name" means an agent hostname in get_active_agents but a package name in
   * get_agent_packages — only tool scoping can distinguish them). Scoped entries win over plain
   * ones for their tool. */
  field: string;
  action: FieldPolicyAction;
  /** Optional explicit pseudonym kind, for fields whose name alone can't be classified (a bare
   * "name" infers VAL; a scoped agent-tool entry declares HOST). */
  kind?: PseudonymKind;
}

/** Infers which pseudonym kind a field name should mint, from the field name alone. Checked in
 * this order so a field matching more than one heuristic resolves predictably; falls back to the
 * generic `VAL` kind for a field that is none of host/ip/user/url. */
export function inferPseudonymKind(field: string): PseudonymKind {
  const lower = field.toLowerCase();
  if (lower.includes('url')) {
    return 'URL';
  }
  if (lower.includes('ip')) {
    return 'IP';
  }
  if (lower.includes('user')) {
    return 'USER';
  }
  if (lower.includes('hostname') || lower.endsWith('.name')) {
    return 'HOST';
  }
  return 'VAL';
}

/** Resolves the policy entry for `field` (optionally scoped to `toolName`). Tool-scoped entries
 * ("toolName/field") are checked first and win over plain ones; plain entries support a trailing
 * `.*` prefix match (e.g. "wazuh.rule.compliance.*" matches "wazuh.rule.compliance" itself and
 * "wazuh.rule.compliance.pci_dss"). First matching entry wins; `undefined` (no matching policy
 * entry) means "allow" by omission. */
export function resolveFieldEntry(
  field: string,
  policy: FieldPolicyEntry[],
  toolName?: string,
): FieldPolicyEntry | undefined {
  if (toolName) {
    const scopedKey = `${toolName}/${field}`;
    for (const entry of policy) {
      if (entry.field === scopedKey) {
        return entry;
      }
    }
  }
  for (const entry of policy) {
    if (entry.field.includes('/')) {
      continue; // Tool-scoped entry for some other tool (or already checked above).
    }
    if (entry.field.endsWith('.*')) {
      const prefix = entry.field.slice(0, -2);
      if (field === prefix || field.startsWith(`${prefix}.`)) {
        return entry;
      }
    } else if (entry.field === field) {
      return entry;
    }
  }
  return undefined;
}

/** Effective action for `field` under `policy` — `'allow'` when no entry matches, since an
 * unlisted field is allowed by omission (the escape hatch's fail-closed default is a digest-only
 * concern, see server/tools/privacy.ts's `applyFieldPolicy`). */
export function resolveFieldAction(
  field: string,
  policy: FieldPolicyEntry[],
  toolName?: string,
): FieldPolicyAction {
  return resolveFieldEntry(field, policy, toolName)?.action ?? 'allow';
}
