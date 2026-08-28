import { schema, TypeOf } from '@osd/config-schema';
import { PluginConfigDescriptor } from '../../../src/core/server';

export const configSchema = schema.object({
  enabled: schema.boolean({ defaultValue: true }),
  /**
   * Base64-encoded 32-byte AES-256 key used to encrypt the `wazuh-ai-assistant-provider` saved
   * object's `apiKey` attribute at rest (server/crypto/api-key-cipher.ts). Generate with:
   * `openssl rand -base64 32`, then set `wazuh_ai_assistant.encryptionKey: "<value>"` in
   * opensearch_dashboards.yml (this plugin's `configPath` is `wazuh_ai_assistant` — see
   * opensearch_dashboards.json — NOT the `wazuhAiAssistant` plugin id).
   *
   * Unset by default, but required to USE API keys at all: with no key configured, provider
   * writes carrying a non-empty `apiKey` are rejected (`requireApiKeyEncryption` in
   * server/routes/settings.ts), and API keys are never stored or read as plaintext — a plaintext
   * value stored by a pre-release build fails decryption and must be re-entered (see
   * docs/ENCRYPTION.md). Never exposed to the browser (see `exposeToBrowser` below) and never
   * logged (server/plugin.ts's setup() logs only whether encryption is enabled, not the key).
   */
  encryptionKey: schema.maybe(schema.string()),
  /**
   * Locks AI Assistant settings/providers to their current configuration. When `true`, every
   * write route in server/routes/settings.ts (provider create/update/delete/set-default, and
   * PUT /settings) is rejected with 403 (`requireSettingsUnlocked`) before it reaches the
   * indexer, regardless of the calling user's own indexer RBAC. Intended for environments where
   * an admin configures the assistant once (provider, privacy defaults, retention) and wants it
   * to stay fixed — see docs/ref/modules/ai-assistant/configuration.md. Read routes (GET
   * /providers, GET /settings, GET /settings/access), the connectivity test (POST
   * /providers/{id}/test — it persists nothing), and conversation CRUD are never affected.
   */
  settingsReadOnly: schema.boolean({ defaultValue: false }),
});

export type WazuhAiAssistantConfigType = TypeOf<typeof configSchema>;

/**
 * Nothing here needs to reach the browser bundle today: provider configuration lives in saved
 * objects and is fetched through the settings routes, not through injected config. Keep this
 * minimal and only widen exposeToBrowser if a future setting genuinely needs to be public.
 * `encryptionKey` in particular must NEVER be added here — it is key material, server-only.
 */
export const config: PluginConfigDescriptor<WazuhAiAssistantConfigType> = {
  schema: configSchema,
  exposeToBrowser: {},
};
