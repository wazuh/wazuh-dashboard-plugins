import {
  ISecurityFactory,
  ManageHosts,
  ServerAPIClient,
  ServerAPIInternalUserClient,
  ServerAPIScopedUserClient,
} from './services';
import { IConfigurationEnhanced } from './services/configuration/enhance-configuration';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhCorePluginSetup {
  dashboardSecurity: ISecurityFactory;
  configuration: IConfigurationEnhanced;
  manageHosts: ManageHosts;
  serverAPIClient: ServerAPIClient;
  api: {
    client: {
      asInternalUser: ServerAPIInternalUserClient;
      asScoped: (context: any, request: any) => ServerAPIScopedUserClient;
    };
  };
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhCorePluginStart {
  dashboardSecurity: ISecurityFactory;
  configuration: IConfigurationEnhanced;
  manageHosts: ManageHosts;
  serverAPIClient: ServerAPIClient;
  api: {
    client: {
      asInternalUser: ServerAPIInternalUserClient;
      asScoped: (context: any, request: any) => ServerAPIScopedUserClient;
    };
  };
}

export type PluginSetup = {
  securityDashboards?: {}; // TODO: Add OpenSearch Dashboards Security interface
};
