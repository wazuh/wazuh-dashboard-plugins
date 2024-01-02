import {
  CacheAPIUserAllowRunAs,
  ISecurityFactory,
  ManageHosts,
  ServerAPIClient,
  ServerAPIHostEntries,
  ServerAPIInternalUserClient,
  ServerAPIScopedUserClient,
  UpdateConfigurationFile,
  UpdateRegistry,
} from './services';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhCorePluginSetup {
  dashboardSecurity: ISecurityFactory;
  cacheAPIUserAllowRunAs: CacheAPIUserAllowRunAs;
  manageHosts: ManageHosts;
  serverAPIClient: ServerAPIClient;
  serverAPIHostEntries: ServerAPIHostEntries;
  updateRegistry: UpdateRegistry;
  updateConfigurationFile: UpdateConfigurationFile;
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
  cacheAPIUserAllowRunAs: CacheAPIUserAllowRunAs;
  manageHosts: ManageHosts;
  serverAPIClient: ServerAPIClient;
  serverAPIHostEntries: ServerAPIHostEntries;
  updateRegistry: UpdateRegistry;
  updateConfigurationFile: UpdateConfigurationFile;
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
