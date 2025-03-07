import { CoreSetup, CoreStart, Plugin } from 'opensearch-dashboards/public';
import {
  AppPluginStartDependencies,
  WazuhFleetPluginSetup,
  WazuhFleetPluginStart,
} from './types';
import { FleetManagement } from './components';
import { getCore, setCore, setPlugins, setWazuhCore } from './plugin-services';
import { appSetup } from './application';

export class WazuhFleetPlugin
  implements Plugin<WazuhFleetPluginSetup, WazuhFleetPluginStart>
{
  public setup(core: CoreSetup): WazuhFleetPluginSetup {
    appSetup({
      registerApp: app => core.application.register(app),
      enrollmentAgentManagement: {
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
      },
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

    return {
      FleetManagement,
    };
  }

  public stop() {}
}
