import { first } from 'rxjs/operators';
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
import { initializeClientContentManager } from './services/plugins/content-manager';
import { setCtiConsoleBaseUrl } from './services/cti-registration/cti-console-url';
import type { WazuhCheckUpdatesPluginConfigType } from './index';

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
  private readonly initializerContext: PluginInitializerContext;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
    this.initializerContext = initializerContext;
  }

  public async setup(core: CoreSetup, plugins: PluginSetup) {
    this.logger.debug('wazuh_check_updates: Setup');

    // The CTI API base URL is a compiled constant unless
    // `wazuh_check_updates.ctiApiUrl` overrides it. Read it before the routes are
    // defined so no handler can observe the pre-configuration value.
    const pluginConfig = await this.initializerContext.config
      .create<WazuhCheckUpdatesPluginConfigType>()
      .pipe(first())
      .toPromise();

    setCtiConsoleBaseUrl(pluginConfig.ctiApiUrl);

    setWazuhCore(plugins.wazuhCore);
    setWazuhCheckUpdatesServices({ logger: this.logger });

    const contentManagerClient = core.opensearch.legacy.createClient(
      'content-manager',
      {
        plugins: [initializeClientContentManager],
      },
    );

    core.http.registerRouteHandlerContext('wazuh_check_updates', () => {
      return {
        logger: this.logger,
        security: plugins.wazuhCore.dashboardSecurity,
        contentManager: contentManagerClient,
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
