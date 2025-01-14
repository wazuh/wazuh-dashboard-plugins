import { i18n } from '@osd/i18n';
import { createHashHistory } from 'history';
import {
  AppMountParameters,
  CoreSetup,
  CoreStart,
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
    // Register an application into the side navigation menu
    core.application.register({
      id: 'wazuhSecurityPolicies',
      title: PLUGIN_NAME,
      category: {
        id: 'wz-category-security-policies',
        label: i18n.translate('wz-app-category-security-policies', {
          defaultMessage: 'Security Policies',
        }),
        order: 200,
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

    // Return methods that should be available to other plugins
    return {
      getGreeting() {
        return i18n.translate('wazuhSecurityPolicies.greetingText', {
          defaultMessage: 'Hello from {name}!',
          values: {
            name: PLUGIN_NAME,
          },
        });
      },
    };
  }

  public start(core: CoreStart): WazuhSecurityPoliciesPluginStart {
    setCore(core);
    return {};
  }

  public stop() {}
}
