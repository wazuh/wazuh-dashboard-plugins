import { API_USER_STATUS_RUN_AS } from '../common/api-user-status-run-as';
import {
  ISecurityFactory,
  ManageHosts,
  ServerAPIClient,
  ServerAPIInternalUserClient,
  ServerAPIScopedUserClient,
} from './services';
import { IConfigurationEnhanced } from './services/enhance-configuration';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhCorePluginSetup {
  dashboardSecurity: ISecurityFactory;
  configuration: IConfigurationEnhanced;
  manageHosts: ManageHosts;
  API_USER_STATUS_RUN_AS: typeof API_USER_STATUS_RUN_AS;
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
  API_USER_STATUS_RUN_AS: typeof API_USER_STATUS_RUN_AS;
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
