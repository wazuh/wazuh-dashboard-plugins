import { mapRetiredField } from '../../common/wazuh-fields';
import { FieldPolicyAction, FieldPolicyEntry } from './privacy';

/**
 * Idempotent normalizer for a persisted `fieldPolicy` array (issue #8802, Slice D). Converges any
 * mix of old (bare `rule.*`/`agent.*`/4.x) and already-migrated `wazuh.*` entries to the canonical
 * `wazuh.*` vocabulary, via `mapRetiredField` (common/wazuh-fields.ts).
 *
 * Used by:
 * - the `assistant-settings` saved-object migration (server/saved_objects/assistant-settings.ts),
 *   run once per persisted document.
 * - the PUT /settings route handler (server/routes/settings.ts), run on every save, so a stale
 *   browser tab that GETs pre-migration data and PUTs it back can't reintroduce old field names
 *   over an already-migrated document.
 *
 * Algorithm:
 * 1. Run `mapRetiredField` on each entry's `field` (it already handles the `tool/field` scoping
 *    and trailing `.*` forms internally, and is a no-op/fixed-point for anything already
 *    `wazuh.`-prefixed — this is what makes running the normalizer twice produce the same result).
 * 2. A `status: 'retired'` entry (no 5.0 equivalent at all):
 *    - action `allow` -> DROP. A dead permissive entry is pure noise.
 *    - action `anonymize`/`never` -> KEEP VERBATIM. Fail-safe direction: a dead protective entry
 *      costs nothing, and dropping one is the only move that could ever create a leak.
 * 3. Every surviving entry is placed into a map keyed by its final field path. When two input
 *    entries converge on the same final key (the "old and new both present" case this migration
 *    exists to handle), the STRICTEST action wins: `never` > `anonymize` > `allow` — a merge can
 *    never downgrade protection, whichever order the entries appeared in. The winning entry's
 *    `kind` is preserved if it has one; otherwise the losing entry's `kind` (if any) is carried
 *    over rather than dropped.
 * 4. Unrecognized fields (user-added, not in `RETIRED_FIELD_MAP` and not `wazuh.`-prefixed) pass
 *    through untouched — never invented, never dropped.
 *
 * Output order: first-seen order of each final field key (stable, not alphabetical) — this keeps
 * the migration's effect on a persisted document easy to read in a diff.
 */
export function normalizeFieldPolicy(
  entries: FieldPolicyEntry[],
): FieldPolicyEntry[] {
  const ACTION_RANK: Record<FieldPolicyAction, number> = {
    allow: 0,
    anonymize: 1,
    never: 2,
  };

  const byField = new Map<string, FieldPolicyEntry>();
  const order: string[] = [];

  for (const entry of entries) {
    const mapped = mapRetiredField(entry.field);

    if (mapped.status === 'retired') {
      if (entry.action === 'allow') {
        continue;
      }
      mergeEntry(entry.field, entry);
      continue;
    }

    mergeEntry(mapped.field, { ...entry, field: mapped.field });
  }

  function mergeEntry(key: string, entry: FieldPolicyEntry): void {
    const existing = byField.get(key);
    if (!existing) {
      byField.set(key, entry);
      order.push(key);
      return;
    }
    if (ACTION_RANK[entry.action] > ACTION_RANK[existing.action]) {
      byField.set(key, { ...entry, kind: entry.kind ?? existing.kind });
    } else if (!existing.kind && entry.kind) {
      byField.set(key, { ...existing, kind: entry.kind });
    }
  }

  return order.map(key => byField.get(key) as FieldPolicyEntry);
}
