import { CoreSetup, CoreStart, Plugin } from 'opensearch-dashboards/public';
import {
  AppPluginStartDependencies,
  WazuhEndpointsPluginSetup,
  WazuhEndpointsPluginStart,
} from './types';

export class WazuhEndpointsPlugin
  implements Plugin<WazuhEndpointsPluginSetup, WazuhEndpointsPluginStart>
{
  public setup(core: CoreSetup): WazuhEndpointsPluginSetup {
    return {};
  }

  public start(
    core: CoreStart,
    plugins: AppPluginStartDependencies,
  ): WazuhEndpointsPluginStart {
    return {};
  }

  public stop() {}
}
