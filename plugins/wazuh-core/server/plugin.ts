import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from 'opensearch-dashboards/server';
import { validate as validateNodeCronInterval } from 'node-cron';
import {
  PluginSetup,
  WazuhCorePluginSetup,
  WazuhCorePluginStart,
} from './types';
import { setCore } from './plugin-services';
import {
  ManageHosts,
  createDashboardSecurity,
  ServerAPIClient,
  ConfigurationStore,
} from './services';
import { Configuration } from '../common/services/configuration';
import {
  PLUGIN_SETTINGS,
  PLUGIN_SETTINGS_CATEGORIES,
  WAZUH_CORE_CONFIGURATION_CACHE_SECONDS,
} from '../common/constants';
import { enhanceConfiguration } from './services/enhance-configuration';
import { DataPathService, IDataPathService } from './services/data-path';
import path from 'path';
import { first } from 'rxjs/operators';

export class WazuhCorePlugin
  implements Plugin<WazuhCorePluginSetup, WazuhCorePluginStart>
{
  private readonly logger: Logger;
  private services: { [key: string]: any };
  private _internal: { [key: string]: any };

  constructor(private initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
    this.services = {};
    this._internal = {};
  }

  public async setup(
    core: CoreSetup,
    plugins: PluginSetup,
  ): Promise<WazuhCorePluginSetup> {
    this.logger.debug('wazuh_core: Setup');

    // Get global configuration
    const globalConfig =
      await this.initializerContext.config.legacy.globalConfig$
        .pipe(first())
        .toPromise();

    // Initialize DataPathService with logger and global configuration
    this.services.dataPathService = new DataPathService(
      this.logger.get('data-path'),
      globalConfig,
    );
    // Setup and start DataPathService
    await this.services.dataPathService.setup();
    await this.services.dataPathService.start();

    this.services.dashboardSecurity = createDashboardSecurity(plugins);

    this._internal.configurationStore = new ConfigurationStore(
      this.logger.get('configuration-store'),
      {
        cache_seconds: WAZUH_CORE_CONFIGURATION_CACHE_SECONDS,
        file: this.services.dataPathService.getConfigFilePath(),
      },
      this.services.dataPathService,
    );
    this.services.configuration = new Configuration(
      this.logger.get('configuration'),
      this._internal.configurationStore,
    );

    // Enhance configuration service
    enhanceConfiguration(this.services.configuration);

    // Register the plugin settings
    Object.entries(PLUGIN_SETTINGS).forEach(([key, value]) =>
      this.services.configuration.register(key, value),
    );

    // Add categories to the configuration
    Object.entries(PLUGIN_SETTINGS_CATEGORIES).forEach(([key, value]) => {
      this.services.configuration.registerCategory({ ...value, id: key });
    });

    this.services.configuration.setup();

    this.services.manageHosts = new ManageHosts(
      this.logger.get('manage-hosts'),
      this.services.configuration,
    );

    this.services.serverAPIClient = new ServerAPIClient(
      this.logger.get('server-api-client'),
      this.services.manageHosts,
      this.services.dashboardSecurity,
    );

    this.services.manageHosts.setServerAPIClient(this.services.serverAPIClient);

    // Register a property to the context parameter of the endpoint handlers
    core.http.registerRouteHandlerContext('wazuh_core', (context, request) => {
      return {
        ...this.services,
        api: {
          client: {
            asInternalUser: this.services.serverAPIClient.asInternalUser,
            asCurrentUser: this.services.serverAPIClient.asScoped(
              context,
              request,
            ),
          },
        },
      };
    });

    return {
      ...this.services,
      api: {
        client: {
          asInternalUser: this.services.serverAPIClient.asInternalUser,
          asScoped: this.services.serverAPIClient.asScoped,
        },
      },
    };
  }

  public async start(core: CoreStart): Promise<WazuhCorePluginStart> {
    this.logger.debug('wazuhCore: Started');

    setCore(core);

    await this.services.configuration.start();
    await this.services.manageHosts.start();

    return {
      ...this.services,
      api: {
        client: {
          asInternalUser: this.services.serverAPIClient.asInternalUser,
          asScoped: this.services.serverAPIClient.asScoped,
        },
      },
    };
  }

  public stop() {}
}
