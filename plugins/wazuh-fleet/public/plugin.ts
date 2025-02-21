import { CoreSetup, CoreStart, Plugin } from 'opensearch-dashboards/public';
import {
  AppPluginSetupDependencies,
  AppPluginStartDependencies,
  WazuhFleetPluginSetup,
  WazuhFleetPluginStart,
} from './types';
import {
  getCore,
  setAgentManagement,
  setCore,
  setEnrollAgentManagement,
  setPlugins,
  setToasts,
  setWazuhCore,
} from './plugin-services';
import { AgentManagement } from './services/agent-management';
import {
  addGroups,
  deleteAgent,
  removeGroups,
  queryManagerService,
  editName,
} from './services/mocks/agent-management';
import { AgentsNavGroup } from './groups/agents';

export class WazuhFleetPlugin
  implements Plugin<WazuhFleetPluginSetup, WazuhFleetPluginStart>
{
  public setup(
    _core: CoreSetup,
    plugins: AppPluginSetupDependencies,
  ): WazuhFleetPluginSetup {
    // TODO: This setter should be local to fleet management instead of using the related to the plugin itself. This approach was done because the integration of FleetManagement is using another setter from plugin-services.
    setAgentManagement(
      AgentManagement({
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
    );
    setEnrollAgentManagement({
      serverAddresSettingName: 'enrollment.dns',
      async getServerAddress() {
        // TODO: this should be replaced by getWazuhCore().configuration.get that in the current state does not return the setting because this is filtering by settings with the category 'wazuhCore'.
        return getCore().uiSettings.get('enrollment.dns');
      },
      async setServerAddress(url) {
        // TODO: this should be replaced by getWazuhCore().configuration.set that is not implemented
        return await getCore().uiSettings.set('enrollment.dns', url);
      },
    });

    plugins.wazuhCore.applicationService.register({
      id: 'wz-management',
      navGroups: [AgentsNavGroup],
    });

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
