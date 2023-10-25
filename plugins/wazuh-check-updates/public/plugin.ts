import { CoreSetup, CoreStart, Plugin } from 'opensearch-dashboards/public';
import {
  AppPluginStartDependencies,
  WazuhCheckUpdatesPluginSetup,
  WazuhCheckUpdatesPluginStart,
} from './types';
import { UpdatesNotification } from './components/updates-notification';
import { DismissNotificationCheck } from './components/dismiss-notification-check';
import { setCore, setWazuhCore } from './plugin-services';
import { ApisUpdateStatus } from './components/apis-update-status';
import { getAvailableUpdates } from './hooks/available-updates';

export class WazuhCheckUpdatesPlugin
  implements Plugin<WazuhCheckUpdatesPluginSetup, WazuhCheckUpdatesPluginStart> {
  public setup(core: CoreSetup): WazuhCheckUpdatesPluginSetup {
    return {};
  }

  public start(core: CoreStart, plugins: AppPluginStartDependencies): WazuhCheckUpdatesPluginStart {
    setCore(core);
    setWazuhCore(plugins.wazuhCore);

    return {
      UpdatesNotification,
      ApisUpdateStatus,
      getAvailableUpdates,
      DismissNotificationCheck,
    };
  }

  public stop() {}
}
