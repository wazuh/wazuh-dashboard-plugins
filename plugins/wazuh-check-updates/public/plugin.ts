import { CoreSetup, CoreStart, Plugin } from 'opensearch-dashboards/public';
import { WazuhCheckUpdatesPluginSetup, WazuhCheckUpdatesPluginStart } from './types';
import { UpdatesNotification } from './components/updates-notification';
import { UpToDateStatus } from './components/up-to-date-status';
import { setCore, setUiSettings } from './plugin-services';
import { CurrentUpdateDetails } from './components/current-update-details';
import { DismissNotificationCheck } from './components/dismiss-notification-check';

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
