import { CoreSetup, CoreStart, Plugin } from 'opensearch-dashboards/public';
import { WazuhCheckUpdatesPluginSetup, WazuhCheckUpdatesPluginStart } from './types';
import { UpdatesNotification } from './components/updates-notification';
import { setCore, setUiSettings } from './plugin-services';
import { ApisUpdateStatus } from './components/apis-update-status';

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
      ApisUpdateStatus,
    };
  }

  public stop() {}
}
