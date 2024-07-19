import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from 'opensearch-dashboards/server';

import {
  PluginSetup,
  WazuhCheckUpdatesPluginSetup,
  WazuhCheckUpdatesPluginStart,
  AppPluginStartDependencies,
} from './types';
import { defineRoutes } from './routes';
import {
  availableUpdatesObject,
  userPreferencesObject,
} from './services/saved-object/types';
import {
  setCore,
  setWazuhCore,
  setInternalSavedObjectsClient,
  setWazuhCheckUpdatesServices,
} from './plugin-services';
import { ISecurityFactory } from '../../wazuh-core/server/services/security-factory';

declare module 'opensearch-dashboards/server' {
  interface RequestHandlerContext {
    wazuh_check_updates: {
      logger: Logger;
      security: ISecurityFactory;
    };
  }
}

export class WazuhCheckUpdatesPlugin
  implements Plugin<WazuhCheckUpdatesPluginSetup, WazuhCheckUpdatesPluginStart>
{
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public async setup(core: CoreSetup, plugins: PluginSetup) {
    this.logger.debug('wazuh_check_updates: Setup');

    setWazuhCore(plugins.wazuhCore);
    setWazuhCheckUpdatesServices({ logger: this.logger });

    core.http.registerRouteHandlerContext('wazuh_check_updates', () => {
      return {
        logger: this.logger,
        security: plugins.wazuhCore.dashboardSecurity,
      };
    });

    const router = core.http.createRouter();

    // Register saved objects types
    core.savedObjects.registerType(availableUpdatesObject);
    core.savedObjects.registerType(userPreferencesObject);

    // Register server side APIs
    defineRoutes(router);

    return {};
  }

  public start(
    core: CoreStart,
    plugins: AppPluginStartDependencies,
  ): WazuhCheckUpdatesPluginStart {
    this.logger.debug('wazuhCheckUpdates: Started');

    const internalSavedObjectsClient =
      core.savedObjects.createInternalRepository();
    setCore(core);

    setInternalSavedObjectsClient(internalSavedObjectsClient);

    return {};
  }

  public stop() {}
}
