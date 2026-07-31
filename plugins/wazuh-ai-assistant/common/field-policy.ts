import { TableSpec } from './types';

/**
 * Field privacy policy: the shared, ISOMORPHIC half of `server/tools/privacy.ts`.
 *
 * It lives in `common/` (not `server/`) because the policy has to be resolvable on BOTH sides:
 * the server applies it to the digest, the executed query and the streamed `table` event, and
 * `public/` has to re-apply the display half to a table that was PERSISTED under an older, looser
 * policy (see `applyPersistedTablePolicy`'s call site in public/components/chat/chat-page.tsx).
 * Everything here is pure — no pseudonym state, no Node/DOM APIs — so the server-side
 * `Pseudonymizer` stays in server/tools/privacy.ts.
 *
 * The three actions do NOT act at the same boundary, and the difference is deliberate:
 *
 * - `never` is a RETRIEVAL control: nothing that may not leave should be fetched in the first
 *   place. The field is stripped from the outbound Indexer projections (`applyProjectionPolicy`),
 *   excluded from the Manager API's `select` (`applyManagerParamPolicy`), rejected as an
 *   aggregation field (`findNeverAggregation`), and dropped from both the digest
 *   (`applyFieldPolicy`) and the rendered table (`applyTablePolicy`).
 * - `anonymize` is a PROVIDER-boundary control ONLY. The value is queried, retrieved, and shown to
 *   the analyst in full — in the answer text (server/routes/chat.ts's `StreamDepseudonymizer`
 *   reverses every pseudonym back to its real value before the delta reaches the browser), in the
 *   tool-call panel (emitted with real arguments), and in the rendered table. The provider is the
 *   only party that ever sees `HOST_1`/`IP_2`. Masking any ONE of those local surfaces (the table
 *   was tried, see issue #8821) only makes a single turn contradict itself: real values in the prose,
 *   pseudonyms in the table below it. Hiding a field from the ANALYST is what `never` is for.
 * - `allow` (also the default for an unlisted field on a typed tool) acts nowhere.
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

/**
 * Display half of the field policy, applied to a `table` StreamEvent's spec: 'never' fields are
 * dropped from the column list, from every row's keys (visible columns AND the row-only investigation
 * fields the row expander reveals), and from `severityColumn` if that column itself went away.
 *
 * 'anonymize' fields deliberately keep their REAL values here — see this module's header: the
 * rendered table is local, and every other local surface (the answer text, the tool-call panel)
 * shows the real value too, so masking this one would only make the same turn contradict itself.
 *
 * `aggFields` (when given) covers the aggregation-table case, where a row's keys are `key`/
 * `doc_count` rather than field paths and per-column resolution therefore can't see the underlying
 * field: if the FIRST top-level aggregation's field is 'never', every bucket key IS a value of that
 * field, so the rows are dropped entirely. Only the first aggregation is consulted because that is
 * the only one `buildTableSpec` renders.
 *
 * Returns `spec` itself when the policy changed nothing, so a policy with no applicable 'never'
 * entry leaves the table byte-identical to a privacy-off one.
 */
export function applyTablePolicy(
  spec: TableSpec,
  policy: FieldPolicyEntry[],
  toolName?: string,
  aggFields?: Record<string, string | undefined>,
): TableSpec {
  const isNever = (field: string): boolean =>
    resolveFieldAction(field, policy, toolName) === 'never';

  const firstAggField = aggFields
    ? aggFields[Object.keys(aggFields)[0]]
    : undefined;
  if (firstAggField && isNever(firstAggField)) {
    return { ...spec, columns: spec.columns, rows: [] };
  }

  const columns = spec.columns.filter(column => !isNever(column.id));
  let changed = columns.length !== spec.columns.length;

  const rows = spec.rows.map(row => {
    const out: Record<string, unknown> = {};
    for (const [field, value] of Object.entries(row)) {
      if (isNever(field)) {
        changed = true;
        continue;
      }
      out[field] = value;
    }
    return out;
  });

  if (!changed) {
    return spec;
  }

  const next: TableSpec = { ...spec, columns, rows };
  if (next.severityColumn && isNever(next.severityColumn)) {
    delete next.severityColumn;
  }
  return next;
}

/**
 * Re-applies the display half of the policy to a PERSISTED table (issue #8821): a table stored with a
 * conversation was filtered under whatever policy was in force when the turn ran, so reopening the
 * conversation has to re-check it — tightening a field to 'never' must take effect on history too,
 * not only on new turns.
 *
 * `toolName` is the name of the tool call the message was displayed with, when known: without it,
 * tool-scoped entries ("get_active_agents/name") cannot resolve and a Manager table restored from
 * history would keep showing a field the current policy hides. Passing a best-effort tool name is
 * deliberately fail-closed — if it is the wrong tool of a multi-tool turn, the outcome is a column
 * hidden that did not have to be, never a hidden column shown.
 */
export function applyPersistedTablePolicy(
  spec: TableSpec,
  policy: FieldPolicyEntry[],
  toolName?: string,
): TableSpec {
  return applyTablePolicy(spec, policy, toolName);
}
