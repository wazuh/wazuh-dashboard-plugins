import { CoreSetup, CoreStart, Plugin } from 'opensearch-dashboards/public';
import { WazuhCorePluginSetup, WazuhCorePluginStart } from './types';
import { setChrome, setCore, setUiSettings } from './plugin-services';
import * as utils from './utils';
import { API_USER_STATUS_RUN_AS } from '../common/api-user-status-run-as';
import * as hooks from './hooks';

export class WazuhCorePlugin
  implements Plugin<WazuhCorePluginSetup, WazuhCorePluginStart>
{
  public setup(core: CoreSetup): WazuhCorePluginSetup {
    return {
      utils,
      API_USER_STATUS_RUN_AS,
    };
  }

  public start(core: CoreStart): WazuhCorePluginStart {
    setChrome(core.chrome);
    setCore(core);
    setUiSettings(core.uiSettings);

    return {
      utils,
      API_USER_STATUS_RUN_AS,
      hooks,
    };
  }

  public stop() {}
}
