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
  UpdateRegistry,
  ConfigurationStore,
} from './services';
import { Configuration } from '../common/services/configuration';
import {
  PLUGIN_SETTINGS,
  WAZUH_CORE_CONFIGURATION_CACHE_SECONDS,
} from '../common/constants';
import { enhanceConfiguration } from './services/enhance-configuration';
import { first } from 'rxjs/operators';
import { WazuhCorePluginConfigType } from '.';
import MigrationConfigFile from './start/tasks/config-file';

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

    // Get the plugin configuration
    const config$ =
      this.initializerContext.config.create<WazuhCorePluginConfigType>();
    const config: WazuhCorePluginConfigType = await config$
      .pipe(first())
      .toPromise();

    this.services.dashboardSecurity = createDashboardSecurity(plugins);

    this._internal.configurationStore = new ConfigurationStore(
      this.logger.get('configuration-saved-object'),
      core.savedObjects,
      {
        ...config.configuration,
        instance: config.instance,
        cache_seconds: WAZUH_CORE_CONFIGURATION_CACHE_SECONDS,
      },
    );
    this.services.configuration = new Configuration(
      this.logger.get('configuration'),
      this._internal.configurationStore,
    );

    // Enhance configurationService
    enhanceConfiguration(this.services.configuration);

    // Register the plugin settings
    Object.entries(PLUGIN_SETTINGS).forEach(([key, value]) =>
      this.services.configuration.register(key, value),
    );

    /* Workaround: Redefine the validation functions of cron.statistics.interval setting.
      Because the settings are defined in the backend and frontend side using the same definitions,
      the validation funtions are not defined there and has to be defined in the frontend side and backend side
      */
    const setting = this.services.configuration._settings.get(
      'cron.statistics.interval',
    );
    !setting.validate &&
      (setting.validate = function (value: string) {
        return validateNodeCronInterval(value)
          ? undefined
          : 'Interval is not valid.';
      });
    !setting.validateBackend &&
      (setting.validateBackend = function (schema) {
        return schema.string({ validate: this.validate });
      });

    this.services.configuration.setup();

    this.services.updateRegistry = new UpdateRegistry(
      this.logger.get('update-registry'),
    );

    this.services.manageHosts = new ManageHosts(
      this.logger.get('manage-hosts'),
      this.services.configuration,
      this.services.updateRegistry,
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

    this._internal.configurationStore.setSavedObjectRepository(
      core.savedObjects.createInternalRepository(),
    );

    await this.services.configuration.start();

    // Migrate the configuration file
    await MigrationConfigFile.start({
      ...this.services,
      configurationStore: this._internal.configurationStore,
      logger: this.logger.get(MigrationConfigFile.name),
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

  public stop() {}
}
