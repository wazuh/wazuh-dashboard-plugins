import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from 'opensearch-dashboards/server';

import { PluginSetup, WazuhCorePluginSetup, WazuhCorePluginStart } from './types';
import { setCore } from './plugin-services';
import { WazuhHostsCtrl } from './controllers';
import { log } from './lib/logger';
import * as ApiInterceptor from './lib/api-interceptor';
import { getConfiguration } from './lib/get-configuration';

export class WazuhCorePlugin implements Plugin<WazuhCorePluginSetup, WazuhCorePluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public async setup(core: CoreSetup, plugins: PluginSetup) {
    this.logger.debug('wazuh_core: Setup');


    return {};
  }

  public start(core: CoreStart): WazuhCorePluginStart {
    this.logger.debug('wazuhCore: Started');
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
      WazuhHostsCtrl,
      getConfiguration,
      log,
    };
  }

  public stop() { }
}
