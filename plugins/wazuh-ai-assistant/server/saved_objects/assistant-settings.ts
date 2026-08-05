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
   * Persistent conversations retention: days to keep a saved conversation before it is deleted.
   * `0` (default) means "keep forever" — no enforcement at all. Enforced by the periodic
   * background job in server/conversation-retention.ts across ALL owners; GET
   * /conversations additionally hides — but never deletes — expired rows between passes.
   */
  conversationRetentionDays: number;
}

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
