import {
  ISecurityFactory,
  ManageHosts,
  ServerAPIClient,
  ServerAPIInternalUserClient,
  ServerAPIScopedUserClient,
} from './services';
import { Configuration } from '../common/services/configuration';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhCorePluginSetup {
  dashboardSecurity: ISecurityFactory;
  configuration: Configuration;
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
  configuration: Configuration;
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
