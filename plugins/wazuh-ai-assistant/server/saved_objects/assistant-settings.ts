import { SavedObjectsType } from '../../../../src/core/server';
import { ASSISTANT_SETTINGS_SAVED_OBJECT_TYPE } from '../../common/constants';
import { FieldPolicyEntry } from '../tools/privacy';

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
   * Persistent conversations retention, in days. Persisted conversations now live in the
   * `wazuh-ai-assistant-sessions` index alias, an ISM-managed data stream on the indexer side
   * (wazuh-indexer-plugins#1422) that already rotates and deletes its own backing indices on a
   * fixed schedule — actual deletion is no longer this app's job. This setting is not currently
   * wired to that ISM policy; doing so (making the policy's retention window configurable from
   * here) is tracked separately (wazuh-dashboard-plugins#8841).
   */
  conversationRetentionDays: number;
}

export const assistantSettingsSavedObjectType: SavedObjectsType = {
  name: ASSISTANT_SETTINGS_SAVED_OBJECT_TYPE,
  // Hidden: this singleton holds the field policy / actions guardrails / privacy
  // defaults, none of which should be reachable or editable via the generic Saved Objects
  // management UI/API. Reached only through server/routes/settings.ts's/chat.ts's own routes, via
  // the request-scoped client with `includedHiddenTypes: [ASSISTANT_SETTINGS_SAVED_OBJECT_TYPE]`
  // (plugin-services.ts's start-service singleton — see server/routes/settings.ts's
  // `getOrCreateAssistantSettings`).
  hidden: true,
  namespaceType: 'single',
  migrations: {},
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
