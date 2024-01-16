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
  CacheAPIUserAllowRunAs,
  ManageHosts,
  createDashboardSecurity,
  ServerAPIClient,
  ServerAPIHostEntries,
  UpdateConfigurationFile,
  UpdateRegistry,
  ConfigurationStore,
} from './services';
import { Configuration } from '../common/services/configuration';
import { PLUGIN_SETTINGS } from '../common/constants';

export class WazuhCorePlugin
  implements Plugin<WazuhCorePluginSetup, WazuhCorePluginStart>
{
  private readonly logger: Logger;
  private services: { [key: string]: any };
  private _internal: { [key: string]: any };

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
    this.services = {};
    this._internal = {};
  }

  public async setup(
    core: CoreSetup,
    plugins: PluginSetup,
  ): Promise<WazuhCorePluginSetup> {
    this.logger.debug('wazuh_core: Setup');

    this.services.dashboardSecurity = createDashboardSecurity(plugins);

    this.services.updateRegistry = new UpdateRegistry(
      this.logger.get('update-registry'),
    );

    this.services.manageHosts = new ManageHosts(
      this.logger.get('manage-hosts'),
      this.services.updateRegistry,
    );

    this.services.serverAPIClient = new ServerAPIClient(
      this.logger.get('server-api-client'),
      this.services.manageHosts,
      this.services.dashboardSecurity,
    );

    this.services.cacheAPIUserAllowRunAs = new CacheAPIUserAllowRunAs(
      this.logger.get('api-user-allow-run-as'),
      this.services.manageHosts,
      this.services.serverAPIClient,
    );

    this.services.serverAPIHostEntries = new ServerAPIHostEntries(
      this.logger.get('server-api-host-entries'),
      this.services.manageHosts,
      this.services.updateRegistry,
      this.services.cacheAPIUserAllowRunAs,
    );

    this._internal.configurationStore = new ConfigurationStore(
      this.logger.get('configuration-saved-object'),
      core.savedObjects,
    );
    this.services.configuration = new Configuration(
      this.logger.get('configuration'),
      this._internal.configurationStore,
    );

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

    this.services.updateConfigurationFile = new UpdateConfigurationFile(
      this.logger.get('update-configuration-file'),
    );

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

  public async start(core: CoreStart): WazuhCorePluginStart {
    this.logger.debug('wazuhCore: Started');

    this._internal.configurationStore.setSavedObjectRepository(
      core.savedObjects.createInternalRepository(),
    );

    await this.services.configuration.start();

    setCore(core);

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
