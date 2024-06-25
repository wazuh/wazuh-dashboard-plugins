import { WazuhCorePluginStart } from '../../wazuh-core/public';

export interface WazuhFleetPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhFleetPluginStart {
  FleetList: () => JSX.Element;
  FleetSideMenu: () => JSX.Element;
}

export interface AppPluginStartDependencies {
  wazuhCore: WazuhCorePluginStart;
}
