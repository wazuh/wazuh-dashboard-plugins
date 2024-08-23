import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from 'opensearch-dashboards/server';

import {
  PluginSetup,
  WazuhEnginePluginSetup,
  WazuhEnginePluginStart,
  AppPluginStartDependencies,
} from './types';
import { defineRoutes } from './routes';
import { setCore, setWazuhCore } from './plugin-services';
import { ISecurityFactory } from '../../wazuh-core/server/services/security-factory';

declare module 'opensearch-dashboards/server' {
  interface RequestHandlerContext {
    wazuh_check_updates: {
      logger: Logger;
      security: ISecurityFactory;
    };
  }
}

export class WazuhEnginePlugin
  implements Plugin<WazuhEnginePluginSetup, WazuhEnginePluginStart>
{
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public async setup(core: CoreSetup, plugins: PluginSetup) {
    this.logger.debug('Setup');

    setWazuhCore(plugins.wazuhCore);

    core.http.registerRouteHandlerContext('wazuh_engine', () => {
      return {
        logger: this.logger,
      };
    });

    const router = core.http.createRouter();

    // Register server side APIs
    defineRoutes(router);

    return {};
  }

  public start(
    core: CoreStart,
    plugins: AppPluginStartDependencies,
  ): WazuhEnginePluginStart {
    this.logger.debug('Started');
    setCore(core);

    return {};
  }

  public stop() {}
}
