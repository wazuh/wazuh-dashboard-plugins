import { i18n } from '@osd/i18n';
import { AppMountParameters, CoreSetup, CoreStart, Plugin } from '../../../src/core/public';
import { PocPluginPluginSetup, PocPluginPluginStart, AppPluginStartDependencies } from './types';
import { PLUGIN_NAME } from '../common';

export class PocPluginPlugin implements Plugin<PocPluginPluginSetup, PocPluginPluginStart> {
  public setup(core: CoreSetup, plugins:unknown): PocPluginPluginSetup {
    // Register an application into the side navigation menu
    console.log( plugins);
    core.application.register({
      id: 'pocPlugin',
      title: PLUGIN_NAME,
      async mount(params: AppMountParameters) {
        // Load application bundle
        const { renderApp } = await import('./application');
        // Get start services as specified in opensearch_dashboards.json
        const [coreStart, depsStart] = await core.getStartServices();
        // Render the application
        return renderApp(coreStart, depsStart as AppPluginStartDependencies, params);
      },
      category: {
        id: 'wazuh',
        label: 'POC Wazuh',
      }
    });

    // Return methods that should be available to other plugins
    return {
      getGreeting() {
        return i18n.translate('pocPlugin.greetingText', {
          defaultMessage: 'Hello from {name}!',
          values: {
            name: PLUGIN_NAME,
          },
        });
      },
    };
  }

  public start(core: CoreStart, plugins:unknown): PocPluginPluginStart {
    console.log(core, plugins);
    return {
      // DashboardContainerByValueRenderer: createDashboardContainerByValueRenderer({
      //   factory: dashboardContainerFactory,
      // }),
    };
  }

  public stop() {}
}
