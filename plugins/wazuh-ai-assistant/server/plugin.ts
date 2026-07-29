import { first } from 'rxjs/operators';
import {
  CoreSetup,
  CoreStart,
  Plugin,
  PluginInitializerContext,
  Logger,
} from '../../../src/core/server';
import { registerRoutes } from './routes';
import { setSavedObjectsStart, setApiKeyCipher } from './plugin-services';
import { providerSettingsSavedObjectType } from './saved_objects/provider-settings';
import { assistantSettingsSavedObjectType } from './saved_objects/assistant-settings';
import { conversationSavedObjectType } from './saved_objects/conversation';
import { ApiKeyCipher, parseEncryptionKey } from './crypto/api-key-cipher';
import { WazuhAiAssistantConfigType } from './config';
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
    // plugin's own config once here and stash a cipher for every route handler to share (same
    // getter/setter singleton pattern as `setSavedObjectsStart` below — see
    // server/plugin-services.ts). `.pipe(first()).toPromise()` is the same idiom the reference
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
    // The DISABLED case is a WARN, not info: it means provider API keys sit in the saved-objects
    // index as plaintext, which is a real (if deliberate, backward-compatible) posture an operator
    // should see rather than have to infer from an info line. Both messages name the OSD keystore
    // FIRST, because that is where this key belongs: `opensearch_dashboards.yml` is world-readable
    // to anyone who can read the config file, whereas the keystore is the platform's own mechanism
    // for exactly this (Wazuh's installer already keeps `opensearch.password` there). Verified on
    // 5.0.0-beta3: a key supplied ONLY via `opensearch-dashboards-keystore add
    // wazuh_ai_assistant.encryptionKey` is picked up here with no yml entry at all.
    if (cipher.enabled) {
      this.logger.info(
        'wazuhAiAssistant: provider API key encryption at rest is ENABLED (see docs/ENCRYPTION.md).',
      );
    } else {
      this.logger.warn(
        'wazuhAiAssistant: provider API key encryption at rest is DISABLED — provider API keys are ' +
          'stored UNENCRYPTED in the saved-objects index. To enable, set a base64 32-byte key as ' +
          'wazuh_ai_assistant.encryptionKey via the OSD keystore (recommended: ' +
          'opensearch-dashboards-keystore add wazuh_ai_assistant.encryptionKey) or in ' +
          'opensearch_dashboards.yml; see docs/ENCRYPTION.md.',
      );
    }

    core.savedObjects.registerType(providerSettingsSavedObjectType);
    core.savedObjects.registerType(assistantSettingsSavedObjectType);
    // All three types are `hidden: true`, which keeps them out of the Saved Objects management UI
    // but does not change registration: a hidden type must still be registered here, and is then
    // reached through a scoped client built with `includedHiddenTypes`.
    core.savedObjects.registerType(conversationSavedObjectType);

    const router = core.http.createRouter();
    registerRoutes(router, this.logger);

    return {};
  }

  public start(core: CoreStart): WazuhAiAssistantPluginStart {
    this.logger.debug('wazuhAiAssistant: start');
    // Stash the savedObjects start contract so the conversation routes can build a scoped client
    // that includes the hidden `wazuh-ai-assistant-conversation` type (see plugin-services.ts).
    setSavedObjectsStart(core.savedObjects);
    return {};
  }

  public stop(): void {
    this.logger.debug('wazuhAiAssistant: stop');
  }
}
