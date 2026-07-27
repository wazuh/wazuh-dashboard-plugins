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
   * Optional and unset by default: with no key configured, provider API keys are stored and read
   * as plaintext, byte-identical to this plugin's behavior before encryption-at-rest existed (see
   * docs/ENCRYPTION.md). Never exposed to the browser (see `exposeToBrowser` below) and never
   * logged (server/plugin.ts's setup() logs only whether encryption is enabled, not the key).
   */
  encryptionKey: schema.maybe(schema.string()),
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
