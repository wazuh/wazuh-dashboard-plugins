import {
  AppCategory,
  AppMountParameters,
  AppNavLinkStatus,
  CoreSetup,
  CoreStart,
  Plugin,
  DEFAULT_APP_CATEGORIES,
} from '../../../src/core/public';
import { i18n } from '@osd/i18n';
import { PLUGIN_ID } from '../common/constants';
import {
  WazuhAiAssistantPluginSetup,
  WazuhAiAssistantPluginSetupDependencies,
  WazuhAiAssistantPluginStart,
  WazuhAiAssistantPluginStartDependencies,
} from './types';

/**
 * A locally defined nav category, following the same pattern Wazuh's own plugins use rather than
 * depending on the platform's `DEFAULT_APP_CATEGORIES` export. That export does exist on the
 * target platform (`src/core/utils/default_app_categories.ts`), so switching this app into one of
 * the platform's categories — or into `plugins/main`'s `wz-category-*` taxonomy — is a one-line
 * change if the dashboard team prefers it.
 *
 * `euiIconType`: `plugins/main/public/utils/applications.ts` gives each Wazuh nav category an EUI
 * app-icon glyph ('securityApp' for "Security operations", 'monitoringApp' for "Endpoint
 * security"). OUI ships no Wazuh brand glyph, so 'securityApp' is used here as the closest
 * semantic match for an AI security-analyst feature.
 */
const WAZUH_APP_CATEGORY: AppCategory = {
  id: 'wazuh',
  label: 'Wazuh',
  order: 4000,
  euiIconType: 'securityApp',
};

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

  public start(_core: CoreStart): WazuhAiAssistantPluginStart {
    return {};
  }

  public stop(): void {}
}
