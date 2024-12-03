import { i18n } from '@osd/i18n';
import { AppMountParameters, CoreSetup, CoreStart, Plugin } from '../../../src/core/public';
import {
  WazuhRulesetPluginSetup,
  WazuhRulesetPluginStart,
  AppPluginStartDependencies,
} from './types';
import { PLUGIN_NAME } from '../common';

export class WazuhRulesetPlugin
  implements Plugin<WazuhRulesetPluginSetup, WazuhRulesetPluginStart> {
  public setup(core: CoreSetup): WazuhRulesetPluginSetup {
    // Register an application into the side navigation menu
    core.application.register({
      id: 'wazuhRuleset',
      title: PLUGIN_NAME,
      async mount(params: AppMountParameters) {
        // Load application bundle
        const { renderApp } = await import('./application');
        // Get start services as specified in opensearch_dashboards.json
        const [coreStart, depsStart] = await core.getStartServices();
        // Render the application
        return renderApp(coreStart, depsStart as AppPluginStartDependencies, params);
      },
    });

    // Return methods that should be available to other plugins
    return {
      getGreeting() {
        return i18n.translate('wazuhRuleset.greetingText', {
          defaultMessage: 'Hello from {name}!',
          values: {
            name: PLUGIN_NAME,
          },
        });
      },
    };
  }

  public start(core: CoreStart): WazuhRulesetPluginStart {
    return {};
  }

  public stop() {}
}
