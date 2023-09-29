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
import { getUpdates } from './services/updates';
import { log } from './lib/logger';

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

    setCore(core);

    return {
      getUpdates,
      log,
    };
  }

  public stop() {}
}
