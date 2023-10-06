import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from 'opensearch-dashboards/server';

import { PluginSetup, WazuhCorePluginSetup, WazuhCorePluginStart } from './types';
import { setCore } from './plugin-services';
import { ISecurityFactory, SecurityObj } from './lib/security-factory';
import { WazuhApiCtrl } from './controllers/wazuh-api';
import { WazuhHostsCtrl } from './controllers/wazuh-hosts';
import { ManageHosts } from './lib/manage-hosts';
import { log } from './lib/logger';
import * as ApiInterceptor  from './lib/api-interceptor';

declare module 'opensearch-dashboards/server' {
  interface RequestHandlerContext {
    wazuh_core: {
      logger: Logger;
      security: ISecurityFactory;
    };
  }
}

export class WazuhCorePlugin implements Plugin<WazuhCorePluginSetup, WazuhCorePluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public async setup(core: CoreSetup, plugins: PluginSetup) {
    this.logger.debug('wazuh_core: Setup');

    const wazuhSecurity = await SecurityObj(plugins);

    core.http.registerRouteHandlerContext('wazuh_core', () => {
      return {
        logger: this.logger,
        security: wazuhSecurity,
      };
    });

    return {};
  }

  public start(core: CoreStart): WazuhCorePluginStart {
    this.logger.debug('wazuhCore: Started');
    // const globalConfiguration: SharedGlobalConfig = await this.initializerContext.config.legacy.globalConfig$.pipe(first()).toPromise();
    const wazuhApiClient = {
      client: {
        asInternalUser: {
          authenticate: async (apiHostID) => await ApiInterceptor.authenticate(apiHostID),
          request: async (method, path, data, options) => await ApiInterceptor.requestAsInternalUser(method, path, data, options),
        }
      }
    };
    setCore(core);
    

    return {
      wazuhApiClient,
      ManageHosts,
      WazuhHostsCtrl,
      log,
    };
  }

  public stop() { }
}
