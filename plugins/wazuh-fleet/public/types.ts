import { WazuhCorePluginStart } from '../../wazuh-core/public';
import { FleetManagementProps } from './components/agents';

export interface WazuhFleetPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhFleetPluginStart {
  FleetManagement: (props: FleetManagementProps) => JSX.Element;
}

export interface AppPluginStartDependencies {
  wazuhCore: WazuhCorePluginStart;
}
