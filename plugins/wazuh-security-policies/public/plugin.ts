import { i18n } from '@osd/i18n';
import { createHashHistory } from 'history';
import {
  AppMountParameters,
  CoreSetup,
  CoreStart,
  DEFAULT_NAV_GROUPS,
  Plugin,
} from '../../../src/core/public';
import { PLUGIN_NAME } from '../common';
import {
  WazuhSecurityPoliciesPluginSetup,
  WazuhSecurityPoliciesPluginStart,
  AppPluginStartDependencies,
} from './types';
import { setCore, setHistory } from './plugin-services';

export class WazuhSecurityPoliciesPlugin
  implements
    Plugin<WazuhSecurityPoliciesPluginSetup, WazuhSecurityPoliciesPluginStart>
{
  public setup(core: CoreSetup): WazuhSecurityPoliciesPluginSetup {
    const pluginId = 'wazuhSecurityPolicies';

    // Register an application into the side navigation menu
    core.application.register({
      id: pluginId,
      title: PLUGIN_NAME,
      category: {
        id: 'wz-category-security-policies',
        label: i18n.translate('wz-app-category-security-policies', {
          defaultMessage: 'Security Policies',
        }),
        order: 1000,
        euiIconType: 'indexRollupApp',
      },
      async mount(params: AppMountParameters) {
        // Load application bundle
        const { renderApp } = await import('./application');
        // Get start services as specified in opensearch_dashboards.json
        const [coreStart, depsStart] = await core.getStartServices();

        setHistory(createHashHistory());

        // Render the application
        return renderApp(
          coreStart,
          depsStart as AppPluginStartDependencies,
          params,
        );
      },
    });

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.all, [
      {
        id: pluginId,
        category: {
          id: 'wz-category-security-policies',
          label: i18n.translate('wz-app-category-security-policies', {
            defaultMessage: 'Security Policies',
          }),
          order: 1000,
          euiIconType: 'indexRollupApp',
        },
      },
    ]);

    // Return methods that should be available to other plugins
    return {};
  }

  public start(core: CoreStart): WazuhSecurityPoliciesPluginStart {
    setCore(core);

    return {};
  }

  public stop() {}
}
