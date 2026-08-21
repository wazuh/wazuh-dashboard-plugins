import { RequestHandlerContext } from '../../../../src/core/server';
import { FieldPolicyEntry } from '../tools/privacy';

/**
 * Attributes of the AI Assistant's plugin-wide settings, however they're actually stored — some
 * go through the Wazuh indexer's Setup plugin API (`index-settings-provider.ts`),
 * `conversationRetentionDays` lives in an ISM policy instead (`ism-settings-provider.ts`). Nothing
 * outside `server/settings/` and `server/routes/settings.ts` needs to know which is which; see
 * `AssistantSettingsProvider` below and `AssistantSettingsManager`
 * (`assistant-settings-manager.ts`), which is what actually reads/writes this combined shape.
 */
export interface AssistantSettingsAttributes {
  privacyDefaultOn: boolean;
  privacyDefaultPerProvider: Record<string, boolean>;
  userCanOverride: boolean;
  fieldPolicy: FieldPolicyEntry[];
  conversationRetentionDays: number;
}

/**
 * One backend for a subset of `AssistantSettingsAttributes`. `AssistantSettingsManager` holds a
 * list of these, registered once at plugin start, and fans a `getSettings`/`updateSettings` call
 * for the FULL settings object out to whichever provider owns each field — no other code needs to
 * know that some settings live in an index document and others in an ISM policy.
 *
 * `fields` is what lets the manager do that fan-out generically instead of hardcoding which keys
 * belong to which provider: it both documents ownership and drives the `pick()` calls that split a
 * full `AssistantSettingsAttributes` into just this provider's slice.
 */
export interface AssistantSettingsProvider<
  K extends keyof AssistantSettingsAttributes = keyof AssistantSettingsAttributes,
> {
  readonly fields: readonly K[];

  /** This provider's own default values for its `fields` — the provider that owns a field is also
   * the one that knows what "not configured yet" should mean for it, so the default lives here
   * rather than in a combined object assembled by a caller. Used by `createDefaults` and by
   * `AssistantSettingsManager.getOrCreateSettings`'s per-field fallback. */
  readonly defaults: Pick<AssistantSettingsAttributes, K>;

  /** This provider's fields as currently stored/provisioned, or `undefined` if nothing has been
   * persisted yet — the manager then falls back to `createDefaults`. A provider that always has
   * something to report (e.g. reads live from an already-provisioned external resource) never
   * needs to return `undefined`. */
  getSettings(
    context: RequestHandlerContext,
  ): Promise<Pick<AssistantSettingsAttributes, K> | undefined>;

  /** Persists this provider's fields; called with exactly the keys in `fields`. Returns the values
   * now in effect, which the caller may re-echo (they don't always equal what was requested — see
   * `IsmSettingsProvider`, whose delete-transition edit is itself a projection, not a byte-exact
   * store/retrieve). */
  updateSettings(
    context: RequestHandlerContext,
    attributes: Pick<AssistantSettingsAttributes, K>,
  ): Promise<Pick<AssistantSettingsAttributes, K>>;

  /** Bootstraps this provider's fields the first time `getSettings` resolves `undefined`, using its
   * own `defaults`. Returns the values now in effect — not necessarily `defaults` verbatim; a
   * provider backed by a resource this plugin cannot create (the ISM policy) simply echoes
   * `defaults` back without writing anything. */
  createDefaults(
    context: RequestHandlerContext,
  ): Promise<Pick<AssistantSettingsAttributes, K>>;
}

/** Projects `source` down to exactly `keys` — how `AssistantSettingsManager` splits a full
 * `AssistantSettingsAttributes` into the slice a single provider declared via its `fields`. */
export function pick<T, K extends keyof T>(
  source: T,
  keys: readonly K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = source[key];
  }
  return result;
}
