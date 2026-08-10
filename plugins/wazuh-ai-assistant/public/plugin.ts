import {
  AppMountParameters,
  AppNavLinkStatus,
  CoreSetup,
  CoreStart,
  Plugin,
} from '../../../src/core/public';
import { i18n } from '@osd/i18n';
import { PLUGIN_ID } from '../common/constants';
import { registerAssistantHeaderButton } from './components/header/assistant-header-button';
import { WAZUH_AI_APP_CATEGORY } from '../common/nav-categories';
import { registerAiNavLink } from './utils/nav-link';
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
  public setup(core: CoreSetup): WazuhAiAssistantPluginSetup {
    core.application.register({
      id: PLUGIN_ID,
      title: i18n.translate('wazuhAiAssistant.app.title', {
        defaultMessage: 'AI Assistant',
      }),
      // `machineLearningApp` rather than a chat glyph (issue #8895): every Wazuh navigation entry
      // uses an icon from EUI's `*App` family (`monitoringApp`, `lensApp`, `securityApp`,
      // `indexRollupApp`, `graphApp`, `packetbeatApp`, ...), and the previous `chatRight` was a plain
      // UI glyph, leaving the assistant the only visually inconsistent entry. `machineLearningApp`
      // is the clearest AI glyph available inside that family in the bundled EUI.
      euiIconType: 'machineLearningApp',
      // Sole app in its own category, so the intra-category order is not contested; what positions
      // the entry in the sidebar is the CATEGORY order (see common/nav-categories.ts).
      // The previous 9070 only ever meant "late within Explore".
      order: 100,
      // Own top-level category instead of the framework's generic `Explore` (issue #8895). The
      // assistant answers across findings, vulnerabilities, agents, configuration assessment, file
      // integrity, MITRE ATT&CK and inventory, so no single existing Wazuh category fits it without
      // presenting it as a sub-feature of that one domain.
      category: WAZUH_AI_APP_CATEGORY,
      navLinkStatus: AppNavLinkStatus.default,
      mount: async (params: AppMountParameters) => {
        const [coreStart] = await core.getStartServices();
        const { renderApp } = await import('./application');
        return renderApp(coreStart, params);
      },
    });

    // The NEW navigation (active when `home:useNewHomePage` is enabled) is a SEPARATE code path from
    // the `category` above: it is populated by nav-group registration, not by the app's category, so
    // setting only `category` leaves the entry ungrouped there. The main `wazuh` plugin registers its
    // own applications the same way and in the same lifecycle phase (`setup`, via
    // `chrome.navGroup`); this plugin registers its own link rather than being listed in main's
    // application array, so the app stays owned by the plugin that defines it.
    registerAiNavLink(core);

    return {};
  }

  public start(core: CoreStart): WazuhAiAssistantPluginStart {
    registerAssistantHeaderButton(core);

    return {};
  }

  public stop(): void {}
}
