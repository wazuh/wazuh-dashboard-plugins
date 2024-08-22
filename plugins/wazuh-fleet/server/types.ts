import { ISecurityFactory } from '../../wazuh-core/server/services/security-factory';
import { WazuhCorePluginStart } from '../../wazuh-core/server';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AppPluginStartDependencies {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhFleetPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhFleetPluginStart {}

export type PluginSetup = {
  securityDashboards?: {}; // TODO: Add OpenSearch Dashboards Security interface
  wazuhCore: { dashboardSecurity: ISecurityFactory };
};

export interface AppPluginStartDependencies {
  wazuhCore: WazuhCorePluginStart;
}
