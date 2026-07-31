import { SavedObjectsType } from '../../../../src/core/server';
import { PROVIDER_SAVED_OBJECT_TYPE } from '../../common/constants';

/**
 * Persists provider connection settings (name, type, endpoint, model, API key).
 *
 * HIDDEN saved-object type (security review follow-up): reached ONLY through this plugin's own
 * admin/owner-scoped routes (server/routes/settings.ts, server/routes/chat.ts) via a start-contract
 * scoped client with `includedHiddenTypes`, never through the generic `/api/saved_objects` API —
 * so a provider row (which holds the API key) can't be listed/read/written by any dashboard user
 * with generic saved-objects-management access. Same treatment as the conversation type; no
 * `management` block, since a hidden type never appears in the Saved Objects management UI.
 *
 * SECURITY NOTE: `apiKey` is application-level encrypted at rest (AES-256-GCM) — see
 * server/crypto/api-key-cipher.ts, server/config.ts, and docs/ENCRYPTION.md. The gate in
 * server/routes/settings.ts refuses to persist a key while `wazuh_ai_assistant.encryptionKey` is
 * unset, so no NEW plaintext can be created here (`index: false` below is a mapping choice, NOT a
 * confidentiality control — the stored value is still returned by `_search`/`_source`). This is a
 * lighter-weight alternative to OSD's Encrypted Saved Objects plugin (mirrors the Elastic AI
 * Assistant "connector" pattern) chosen to avoid a new plugin dependency; migrating to Encrypted
 * Saved Objects remains a reasonable future upgrade if this plugin ever declares that dependency.
 */
export const providerSettingsSavedObjectType: SavedObjectsType = {
  name: PROVIDER_SAVED_OBJECT_TYPE,
  hidden: true,
  namespaceType: 'single',
  migrations: {},
  mappings: {
    properties: {
      name: { type: 'keyword' },
      type: { type: 'keyword' },
      baseUrl: { type: 'keyword' },
      model: { type: 'keyword' },
      apiKey: { type: 'keyword', index: false },
      isDefault: { type: 'boolean' },
    },
  },
};
