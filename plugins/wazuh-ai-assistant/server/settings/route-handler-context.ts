import { AssistantSettingsManager } from './assistant-settings-manager';
import { IndexSettingsProvider } from './index-settings-provider';
import { IsmSettingsProvider } from './ism-settings-provider';
import { AiProvidersClient } from './ai-providers-client';

/**
 * Builds the single `AssistantSettingsManager` for this plugin, with both backends registered
 * (wazuh-dashboard-plugins#8841/#500): `IndexSettingsProvider` for privacy defaults/override/field
 * policy (the Wazuh indexer's `/_plugins/_setup/ai_assistant/settings` endpoint — see that
 * provider's doc comment for the OpenAPI spec link) and `IsmSettingsProvider` for
 * `conversationRetentionDays` (an ISM policy — see that provider's doc comment for the policy id).
 *
 * Called once from `server/plugin.ts`'s `setup()`, which hands the instance to
 * `core.http.registerRouteHandlerContext('wazuh_ai_assistant', ...)` (see the `declare module`
 * augmentation below) — route handlers reach it as `context.wazuh_ai_assistant.assistantSettings`,
 * never by importing a module-level singleton of their own.
 */
export function createAssistantSettingsManager(): AssistantSettingsManager {
  const manager = new AssistantSettingsManager();
  manager.registerProvider(new IndexSettingsProvider());
  manager.registerProvider(new IsmSettingsProvider());
  return manager;
}

declare module '../../../../src/core/server' {
  interface RequestHandlerContext {
    wazuh_ai_assistant: {
      assistantSettings: AssistantSettingsManager;
      aiProviders: AiProvidersClient;
    };
  }
}
