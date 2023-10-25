import { AxiosResponse } from 'axios';
import { APIInterceptorRequestOptionsInternalUser } from './services/api-interceptor';
import { WazuhHostsCtrl } from './controllers';
import { ISecurityFactory } from './services/security-factory';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhCorePluginSetup {
  wazuhSecurity: ISecurityFactory;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhCorePluginStart {
  controllers: {
    WazuhHostsCtrl: typeof WazuhHostsCtrl;
  };
  services: {
    log: (location: string, message: string, level?: string) => void;
    wazuhApiClient: {
      client: {
        asInternalUser: {
          authenticate: (apiHostID: string) => Promise<string>;
          request: (
            method: string,
            path: string,
            data: any,
            options: APIInterceptorRequestOptionsInternalUser
          ) => Promise<AxiosResponse<any, any>>;
        };
      };
    };
  };
}

export type PluginSetup = {
  securityDashboards?: {}; // TODO: Add OpenSearch Dashboards Security interface
};
