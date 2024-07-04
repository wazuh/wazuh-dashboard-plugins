import { WazuhCorePluginStart } from '../../wazuh-core/public';
import { FleetManagementProps } from './components/fleet-management';
import { DashboardStart } from '../../../src/plugins/dashboard/public';

export interface WazuhFleetPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhFleetPluginStart {
  FleetManagement: (props: FleetManagementProps) => JSX.Element;
}

export interface AppPluginStartDependencies {
  wazuhCore: WazuhCorePluginStart;
  dashboard: DashboardStart;
}
