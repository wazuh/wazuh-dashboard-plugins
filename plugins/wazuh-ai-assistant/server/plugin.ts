import { first } from 'rxjs/operators';
import {
  CoreSetup,
  CoreStart,
  Plugin,
  PluginInitializerContext,
  Logger,
} from '../../../src/core/server';
import { registerRoutes } from './routes';
import { setApiKeyCipher } from './plugin-services';
import { ApiKeyCipher, parseEncryptionKey } from './crypto/api-key-cipher';
import { WazuhAiAssistantConfigType } from './config';
import { createAssistantSettingsManager } from './settings/route-handler-context';
import { AiProvidersClient } from './settings/ai-providers-client';
import {
  WazuhAiAssistantPluginSetup,
  WazuhAiAssistantPluginSetupDependencies,
  WazuhAiAssistantPluginStart,
  WazuhAiAssistantPluginStartDependencies,
} from './types';

export class WazuhAiAssistantPlugin
  implements
    Plugin<
      WazuhAiAssistantPluginSetup,
      WazuhAiAssistantPluginStart,
      WazuhAiAssistantPluginSetupDependencies,
      WazuhAiAssistantPluginStartDependencies
    >
{
  private readonly logger: Logger;
  private readonly initializerContext: PluginInitializerContext;

  constructor(initializerContext: PluginInitializerContext) {
    this.initializerContext = initializerContext;
    this.logger = initializerContext.logger.get();
  }

  public async setup(core: CoreSetup): Promise<WazuhAiAssistantPluginSetup> {
    this.logger.debug('wazuhAiAssistant: setup');

    // Encryption-at-rest for provider API keys (server/crypto/api-key-cipher.ts): read this
    // plugin's own config once here and stash a cipher for every route handler to share (the
    // getter/setter singleton pattern documented in server/plugin-services.ts).
    // `.pipe(first()).toPromise()` is the same idiom the reference
    // main plugin uses to read its own config in setup() (wdp-5/plugins/main/server/plugin.ts:
    // `const config = await config$.pipe(first()).toPromise();`), confirming this is the standard
    // OSD/Kibana plugin-platform convention rather than something specific to this plugin.
    const config$ =
      this.initializerContext.config.create<WazuhAiAssistantConfigType>();
    const pluginConfig = await config$.pipe(first()).toPromise();

    // Fail fast: a present-but-invalid key must stop plugin startup, not silently run with
    // encryption disabled or a broken key.
    const keyBuffer = parseEncryptionKey(pluginConfig.encryptionKey);
    const cipher = new ApiKeyCipher(keyBuffer);
    setApiKeyCipher(cipher);
    // Exactly one line either way, ENABLED/DISABLED only — never the key material itself.
    // The DISABLED case is a WARN, not info: it means provider API keys cannot be saved or used
    // at all (they are never stored/read as plaintext), a posture an operator
    // should see rather than have to infer from an info line. Both messages name the keystore
    // FIRST, because that is where this key belongs: `opensearch_dashboards.yml` is world-readable
    // to anyone who can read the config file, whereas the keystore is the platform's own mechanism
    // for exactly this (Wazuh's installer already keeps `opensearch.password` there). Verified on
    // 5.0.0-beta3: a key supplied ONLY via `opensearch-dashboards-keystore add
    // wazuh_ai_assistant.encryptionKey` is picked up here with no yml entry at all.
    if (cipher.enabled) {
      this.logger.info(
        'wazuhAiAssistant: provider API key encryption at rest is ENABLED.',
      );
    } else {
      this.logger.warn(
        'wazuhAiAssistant: provider API key encryption at rest is DISABLED — provider API keys ' +
          'cannot be saved or used (they are never stored in plain text). To enable, set a ' +
          'base64 32-byte key as wazuh_ai_assistant.encryptionKey via the keystore (recommended: ' +
          'opensearch-dashboards-keystore add wazuh_ai_assistant.encryptionKey) or in ' +
          'opensearch_dashboards.yml.',
      );
    }

    // This plugin registers no saved object types: persisted conversations live in the
    // `wazuh-ai-assistant-sessions` index alias (server/conversation-store.ts); AI provider
    // configuration, privacy defaults/override/field policy, and (via a separate ISM policy)
    // `conversationRetentionDays` all go through the Wazuh indexer's own APIs instead of direct
    // index access (server/settings/ai-providers-client.ts, index-settings-provider.ts,
    // ism-settings-provider.ts) — all provisioned/owned indexer-side, not by this plugin
    // (wazuh-indexer-plugins#1422, wazuh-dashboard-plugins#8841/#500).

    // Single `AssistantSettingsManager` and `AiProvidersClient` for the whole plugin, reached by
    // every route handler as `context.wazuh_ai_assistant.{assistantSettings,aiProviders}` (see
    // server/settings/route-handler-context.ts) rather than a module-level singleton imported by
    // whichever file happens to need it.
    const assistantSettingsManager = createAssistantSettingsManager();
    const aiProvidersClient = new AiProvidersClient();
    core.http.registerRouteHandlerContext('wazuh_ai_assistant', () => ({
      assistantSettings: assistantSettingsManager,
      aiProviders: aiProvidersClient,
    }));

    const router = core.http.createRouter();
    registerRoutes(router, this.logger);

    return {};
  }

  public start(_core: CoreStart): WazuhAiAssistantPluginStart {
    this.logger.debug('wazuhAiAssistant: start');
    return {};
  }

  public stop(): void {
    this.logger.debug('wazuhAiAssistant: stop');
  }
}
