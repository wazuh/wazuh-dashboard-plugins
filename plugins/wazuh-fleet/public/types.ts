import { WazuhCorePluginStart } from '../../wazuh-core/public';
import { DashboardStart } from '../../../src/plugins/dashboard/public';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WazuhFleetPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-empty-object-type
export interface WazuhFleetPluginStart {}

export interface AppPluginStartDependencies {
  wazuhCore: WazuhCorePluginStart;
  dashboard: DashboardStart;
}
