import { CoreSetup, CoreStart, Plugin } from 'opensearch-dashboards/public';
import { createHashHistory } from 'history';
import {
  AppPluginStartDependencies,
  WazuhFleetPluginSetup,
  WazuhFleetPluginStart,
} from './types';
import { setCore, setPlugins, setWazuhCore } from './plugin-services';
import { appSetup } from './application';
import NavigationService from './react-services/navigation-service';
import { AgentManagement } from './services/agent-management';

export class WazuhFleetPlugin
  implements Plugin<WazuhFleetPluginSetup, WazuhFleetPluginStart>
{
  public setup(core: CoreSetup): WazuhFleetPluginSetup {
    appSetup({
      registerApp: app => core.application.register(app),
      agentManagement: AgentManagement(),
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

    return {};
  }

  public stop() {}
}
