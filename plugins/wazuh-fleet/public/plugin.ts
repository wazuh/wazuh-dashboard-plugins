import { CoreSetup, CoreStart, Plugin } from 'opensearch-dashboards/public';
import { createHashHistory } from 'history';
import {
  AppPluginStartDependencies,
  WazuhFleetPluginSetup,
  WazuhFleetPluginStart,
} from './types';
import { FleetManagement } from './components';
import { setCore, setPlugins, setWazuhCore } from './plugin-services';
import { appSetup } from './application';
import NavigationService from './react-services/navigation-service';

export class WazuhFleetPlugin
  implements Plugin<WazuhFleetPluginSetup, WazuhFleetPluginStart>
{
  public setup(core: CoreSetup): WazuhFleetPluginSetup {
    appSetup({
      registerApp: app => core.application.register(app),
    });
    NavigationService.getInstance(createHashHistory());

    return {};
  }

  public start(
    core: CoreStart,
    plugins: AppPluginStartDependencies,
  ): WazuhFleetPluginStart {
    setCore(core);
    setPlugins(plugins);
    setWazuhCore(plugins.wazuhCore);

    return {
      FleetManagement,
    };
  }

  public stop() {}
}
