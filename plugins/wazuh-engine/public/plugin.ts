import { CoreSetup, CoreStart, Plugin } from 'opensearch-dashboards/public';
import {
  AppPluginStartDependencies,
  WazuhEnginePluginSetup,
  WazuhEnginePluginStart,
} from './types';
import { setCore, setWazuhCore } from './plugin-services';
import { Engine } from './components/engine';

export class WazuhEnginePlugin
  implements Plugin<WazuhEnginePluginSetup, WazuhEnginePluginStart>
{
  public setup(core: CoreSetup): WazuhEnginePluginSetup {
    return {};
  }

  public start(
    core: CoreStart,
    plugins: AppPluginStartDependencies,
  ): WazuhEnginePluginStart {
    setCore(core);
    setWazuhCore(plugins.wazuhCore);

    return { Engine };
  }

  public stop() {}
}
