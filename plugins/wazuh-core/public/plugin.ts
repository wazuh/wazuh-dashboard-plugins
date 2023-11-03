import { CoreSetup, CoreStart, Plugin } from 'opensearch-dashboards/public';
import { WazuhCorePluginSetup, WazuhCorePluginStart } from './types';
import { setCore, setUiSettings } from './plugin-services';
import * as utils from './utils';

export class WazuhCorePlugin
  implements Plugin<WazuhCorePluginSetup, WazuhCorePluginStart>
{
  public setup(core: CoreSetup): WazuhCorePluginSetup {
    return {};
  }

  public start(core: CoreStart): WazuhCorePluginStart {
    setCore(core);
    setUiSettings(core.uiSettings);

    return {
      utils,
    };
  }

  public stop() {}
}
