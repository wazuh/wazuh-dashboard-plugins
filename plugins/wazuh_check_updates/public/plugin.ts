import { CoreSetup, CoreStart, Plugin } from 'opensearch-dashboards/public';
import { WazuhCheckUpdatesPluginSetup, WazuhCheckUpdatesPluginStart } from './types';
import { UpdatesNotification } from './components/updatesNotification';
import { UpToDateStatus } from './components/upToDateStatus';
import { setCore, setUiSettings } from './plugin-services';
import { CurrentUpdateDetails } from './components/currentUpdateDetails';
import { DismissNotificationCheck } from './components/dismissNotificationCheck';

export class WazuhCheckUpdatesPlugin
  implements Plugin<WazuhCheckUpdatesPluginSetup, WazuhCheckUpdatesPluginStart> {
  public setup(core: CoreSetup): WazuhCheckUpdatesPluginSetup {
    // Register an application into the side navigation menu
    // core.application.register({
    //   id: 'wazuhCheckUpdates',
    //   title: PLUGIN_NAME,
    //   async mount(params: AppMountParameters) {
    //     // Load application bundle
    //     const { renderApp } = await import('./application');
    //     // Get start services as specified in opensearch_dashboards.json
    //     const [coreStart, depsStart] = await core.getStartServices();
    //     // Render the application
    //     return renderApp(coreStart, depsStart as AppPluginStartDependencies, params);
    //   },
    // });

    // Return methods that should be available to other plugins
    return {};
  }

  public start(core: CoreStart): WazuhCheckUpdatesPluginStart {
    setCore(core);
    setUiSettings(core.uiSettings);

    return {
      UpdatesNotification,
      UpToDateStatus,
      CurrentUpdateDetails,
      DismissNotificationCheck,
    };
  }

  public stop() {}
}
