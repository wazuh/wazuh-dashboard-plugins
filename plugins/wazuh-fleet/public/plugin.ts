import { CoreSetup, CoreStart, Plugin } from 'opensearch-dashboards/public';
import { PLUGIN_ID } from '../common/constants';
import {
  AppPluginSetupDependencies,
  AppPluginStartDependencies,
  WazuhFleetPluginSetup,
  WazuhFleetPluginStart,
} from './types';
import {
  getCore,
  getIndexPattern,
  setAgentManagement,
  setCore,
  setEnrollAgentManagement,
  setIndexPattern,
  setPlugins,
  setToasts,
  setVersionList,
  setWazuhCore,
} from './plugin-services';
import { AgentManagement } from './services/agent-management';
import {
  addGroups,
  deleteAgent,
  removeGroups,
  editName,
  upgradeAgent,
} from './services/mocks/agent-management';
import { AgentsNavGroup } from './groups/agents';
import { versionsToUpgradeMock } from './services/mocks/agent-version';

export class WazuhFleetPlugin
  implements Plugin<WazuhFleetPluginSetup, WazuhFleetPluginStart>
{
  public setup(
    _core: CoreSetup,
    plugins: AppPluginSetupDependencies,
  ): WazuhFleetPluginSetup {
    setEnrollAgentManagement({
      serverURLSettingName: 'enrollment.url',
      async getServerURL() {
        // TODO: this should be replaced by getWazuhCore().configuration.get that in the current state does not return the setting because this is filtering by settings with the category 'wazuhCore'.
        return getCore().uiSettings.get('enrollment.url');
      },
      async setServerURL(url) {
        // TODO: this should be replaced by getWazuhCore().configuration.set that is not implemented
        return await getCore().uiSettings.set('enrollment.url', url);
      },
      commsURLSettingName: 'enrollment.commsUrl',
      async getCommunicationsURL() {
        // TODO: this should be replaced by getWazuhCore().configuration.get that in the current state does not return the setting because this is filtering by settings with the category 'wazuhCore'.
        return getCore().uiSettings.get('enrollment.commsUrl');
      },
      async setCommunicationsURL(url) {
        // TODO: this should be replaced by getWazuhCore().configuration.set that is not implemented
        return await getCore().uiSettings.set('enrollment.commsUrl', url);
      },
    });

    setIndexPattern({ getIndexPatternId: () => 'wazuh-agents*' });

    setVersionList({
      getVersions: async () => versionsToUpgradeMock,
    });

    plugins.wazuhCore.applicationService.register({
      id: PLUGIN_ID,
      navGroups: [AgentsNavGroup],
    });

    return {};
  }

  public async start(
    core: CoreStart,
    plugins: AppPluginStartDependencies,
  ): Promise<WazuhFleetPluginStart> {
    const queryManagerFactory = plugins.wazuhCore.queryManagerFactory;
    const fleetQueryManager = await queryManagerFactory.create({
      indexPatterns: [{ id: getIndexPattern().getIndexPatternId() }],
    });

    // TODO: This setter should be local to fleet management instead of using the related to the plugin itself. This approach was done because the integration of FleetManagement is using another setter from plugin-services.
    setAgentManagement(
      AgentManagement({
        queryManagerService: fleetQueryManager,
        deleteAgent: (agentId: string | string[]) => deleteAgent(agentId),
        removeGroups: (agentId: string, groupsIds: string | string[]) =>
          removeGroups(agentId, groupsIds),
        addGroups: (agentId: string, groups: string | string[]) =>
          addGroups(agentId, groups),
        editAgentName: (agentId: string, name: string) =>
          editName(agentId, name),
        upgradeAgent: (agentIds, version) => upgradeAgent(agentIds, version),
      }),
    );

    setCore(core);
    setPlugins(plugins);
    setWazuhCore(plugins.wazuhCore);
    setToasts(core.notifications.toasts);

    return {};
  }

  public stop() {}
}
