import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from 'opensearch-dashboards/server';

import {
  PluginSetup,
  WazuhFleetPluginSetup,
  WazuhFleetPluginStart,
  AppPluginStartDependencies,
} from './types';

import {
  setCore,
  setWazuhCore,
  setInternalSavedObjectsClient,
  setWazuhFleetServices,
} from './plugin-services';
import { ISecurityFactory } from '../../wazuh-core/server/services/security-factory';

declare module 'opensearch-dashboards/server' {
  interface RequestHandlerContext {
    wazuh_fleet: {
      logger: Logger;
      security: ISecurityFactory;
    };
  }
}

export class WazuhFleetPlugin
  implements Plugin<WazuhFleetPluginSetup, WazuhFleetPluginStart>
{
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public async setup(core: CoreSetup, plugins: PluginSetup) {
    this.logger.debug('wazuh_fleet: Setup');

    setWazuhCore(plugins.wazuhCore);
    setWazuhFleetServices({ logger: this.logger });

    core.http.registerRouteHandlerContext('wazuh_fleet', () => {
      return {
        logger: this.logger,
        security: plugins.wazuhCore.dashboardSecurity,
      };
    });

    return {};
  }

  public start(
    core: CoreStart,
    plugins: AppPluginStartDependencies,
  ): WazuhFleetPluginStart {
    this.logger.debug('wazuhFleet: Started');

    const internalSavedObjectsClient =
      core.savedObjects.createInternalRepository();
    setCore(core);

    setInternalSavedObjectsClient(internalSavedObjectsClient);

    return {};
  }

  public stop() {}
}
