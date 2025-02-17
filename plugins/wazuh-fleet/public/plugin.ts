import { CoreSetup, CoreStart, Plugin } from 'opensearch-dashboards/public';
import { createHashHistory } from 'history';
import {
  AppPluginStartDependencies,
  WazuhFleetPluginSetup,
  WazuhFleetPluginStart,
} from './types';
import {
  getCore,
  setCore,
  setPlugins,
  setToasts,
  setWazuhCore,
} from './plugin-services';
import { appSetup } from './application';
import NavigationService from './react-services/navigation-service';
import { AgentManagement } from './services/agent-management';
import {
  addGroups,
  deleteAgent,
  removeGroups,
  queryManagerService,
  editName,
} from './services/mocks/agent-management';

export class WazuhFleetPlugin
  implements Plugin<WazuhFleetPluginSetup, WazuhFleetPluginStart>
{
  public setup(core: CoreSetup): WazuhFleetPluginSetup {
    appSetup({
      registerApp: app => core.application.register(app),
      agentManagement: AgentManagement({
        queryManagerService,
        getIndexPatternId: () => 'wazuh-agents*',
        deleteAgent: (agentId: string | string[]) => deleteAgent(agentId),
        removeGroups: (agentId: string, groupsIds: string | string[]) =>
          removeGroups(agentId, groupsIds),
        addGroups: (agentId: string, groups: string | string[]) =>
          addGroups(agentId, groups),
        editAgentName: (agentId: string, name: string) =>
          editName(agentId, name),
      }),
      enrollmentAgentManagement: {
        serverAddresSettingName: 'enrollment.dns',
        async getServerAddress() {
          // TODO: this should be replaced by getWazuhCore().configuration.get that in the current state does not return the setting because this is filtering by settings with the category 'wazuhCore'.
          return getCore().uiSettings.get('enrollment.dns');
        },
        async setServerAddress(url) {
          // TODO: this should be replaced by getWazuhCore().configuration.set that is not implemented
          return await getCore().uiSettings.set('enrollment.dns', url);
        },
      },
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
    setToasts(core.notifications.toasts);

    return {};
  }

  public stop() {}
}
