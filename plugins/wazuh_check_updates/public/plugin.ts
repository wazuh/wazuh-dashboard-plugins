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
