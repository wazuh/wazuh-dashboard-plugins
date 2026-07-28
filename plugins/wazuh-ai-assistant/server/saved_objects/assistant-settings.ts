import {
  SavedObjectMigrationFn,
  SavedObjectsType,
} from '../../../../src/core/server';
import { ASSISTANT_SETTINGS_SAVED_OBJECT_TYPE } from '../../common/constants';
import { FieldPolicyEntry } from '../tools/privacy';
import { normalizeFieldPolicy } from '../tools/field-policy-normalizer';

/**
 * Attributes of the `wazuh-ai-assistant-settings` singleton. Scoped
 * to the privacy feature plus conversation retention. (An `actions` block existed here while the
 * plugin still shipped mutating tools; those were removed by product decision — a stored `actions`
 * blob from an older build is ignored on read and never re-written.)
 */
export interface AssistantSettingsAttributes {
  /** Global default when no per-provider override (below) is set for the request's provider. */
  privacyDefaultOn: boolean;
  /** Per-provider default on/off, keyed by provider id; falls back to `privacyDefaultOn` when a
   * given provider has no entry. */
  privacyDefaultPerProvider: Record<string, boolean>;
  /** Whether the chat request's `privacy.enabled` may override the resolved default at all. */
  userCanOverride: boolean;
  fieldPolicy: FieldPolicyEntry[];
  /**
   * Persistent conversations retention: days to keep a saved conversation before it is
   * excluded from GET /conversations and best-effort deleted (server/routes/conversations.ts).
   * `0` (default) means "keep forever" — no enforcement at all. There is no scheduled/cron
   * pruning: OSD plugins have no background job runner, so this is enforced ON-ACCESS ONLY, i.e.
   * only when GET /conversations actually runs; a conversation past its retention window that is
   * never listed again (no user ever opens the Chat tab) simply stays on disk until it is.
   */
  conversationRetentionDays: number;
}

/**
 * Migrates a persisted `fieldPolicy` array from the retired 4.x/ECS-generic field vocabulary
 * (`rule.*`/`agent.*`/`data.*`/...) to the `wazuh.*` 5.0 vocabulary (issue #8802, Slice D).
 *
 * Guarded pass-through: any document whose `fieldPolicy` attribute is missing or not an array
 * (should not happen for this type, but a throwing migration blocks OSD startup entirely, so this
 * is deliberately conservative) is returned completely untouched. All the real logic lives in the
 * pure, independently-unit-tested `normalizeFieldPolicy` (server/tools/field-policy-normalizer.ts)
 * — this wrapper only adapts it to the saved-objects migration function shape.
 *
 * Version key `'3.6.0'` matches this plugin's `package.json`'s `pluginPlatform.version` — the only
 * key available for the whole 5.0 platform line (see design ADR-2). Because `normalizeFieldPolicy`
 * is a convergent normalizer (idempotent via `mapRetiredField`'s `wazuh.`-prefix short-circuit),
 * running it again on an already-migrated document is a safe no-op — there is no risk in it
 * running more than once even though OSD only runs a given migration key once per document.
 */
export const migrateFieldPolicyTo50: SavedObjectMigrationFn<
  Partial<AssistantSettingsAttributes>,
  Partial<AssistantSettingsAttributes>
> = doc => {
  if (!Array.isArray(doc.attributes?.fieldPolicy)) {
    return doc;
  }
  return {
    ...doc,
    attributes: {
      ...doc.attributes,
      fieldPolicy: normalizeFieldPolicy(
        doc.attributes.fieldPolicy as FieldPolicyEntry[],
      ),
    },
  };
};

export const assistantSettingsSavedObjectType: SavedObjectsType = {
  name: ASSISTANT_SETTINGS_SAVED_OBJECT_TYPE,
  // Hidden: this singleton holds the field policy / actions guardrails / privacy
  // defaults, none of which should be reachable or editable via the generic Saved Objects
  // management UI/API — same rationale as CONVERSATION_SAVED_OBJECT_TYPE (server/saved_objects/
  // conversation.ts). Reached only through server/routes/settings.ts's/chat.ts's own routes, via the
  // request-scoped client with `includedHiddenTypes: [ASSISTANT_SETTINGS_SAVED_OBJECT_TYPE]`
  // (plugin-services.ts's start-service singleton — see server/routes/settings.ts's
  // `getOrCreateAssistantSettings`).
  hidden: true,
  namespaceType: 'single',
  migrations: {
    '3.6.0': migrateFieldPolicyTo50,
  },
  management: {
    importableAndExportable: false,
    icon: 'securityApp',
    getTitle: () => 'AI Assistant settings',
  },
  mappings: {
    properties: {
      privacyDefaultOn: { type: 'boolean' },
      // Opaque JSON bags: `enabled: false` stores them without indexing (no useful search
      // surface for a per-provider bool map or a field-policy array), mirroring how other OSD
      // saved objects park free-form config blobs.
      privacyDefaultPerProvider: { type: 'object', enabled: false },
      userCanOverride: { type: 'boolean' },
      fieldPolicy: { type: 'object', enabled: false },
      conversationRetentionDays: { type: 'integer' },
    },
  },
};
