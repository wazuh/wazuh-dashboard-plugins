import {
  AppMountParameters,
  AppNavLinkStatus,
  CoreSetup,
  CoreStart,
  Plugin,
  DEFAULT_APP_CATEGORIES,
} from '../../../src/core/public';
import { i18n } from '@osd/i18n';
import { PLUGIN_ID } from '../common/constants';
import { registerAssistantHeaderButton } from './components/header/assistant-header-button';
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
      euiIconType: 'chatRight',
      order: 9070,
      category: DEFAULT_APP_CATEGORIES.explore,
      navLinkStatus: AppNavLinkStatus.default,
      mount: async (params: AppMountParameters) => {
        const [coreStart] = await core.getStartServices();
        const { renderApp } = await import('./application');
        return renderApp(coreStart, params);
      },
    });

    return {};
  }

  public start(core: CoreStart): WazuhAiAssistantPluginStart {
    registerAssistantHeaderButton(core);

    return {};
  }

  public stop(): void {}
}
