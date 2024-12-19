import {
  ServerAPIInternalUserClient,
  ServerAPIScopedUserClient,
  WazuhCoreServices,
} from './services';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhCorePluginSetup extends WazuhCoreServices {
  api: {
    client: {
      asInternalUser: ServerAPIInternalUserClient;
      asScoped: (context: any, request: any) => ServerAPIScopedUserClient;
    };
  };
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhCorePluginStart extends WazuhCoreServices {
  api: {
    client: {
      asInternalUser: ServerAPIInternalUserClient;
      asScoped: (context: any, request: any) => ServerAPIScopedUserClient;
    };
  };
}

export interface PluginSetup {
  securityDashboards?: object; // TODO: Add OpenSearch Dashboards Security interface
}

export * from './services/initialization/types';
