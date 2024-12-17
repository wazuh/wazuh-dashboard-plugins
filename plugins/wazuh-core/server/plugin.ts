import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from 'opensearch-dashboards/server';
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
} from './services';
// configuration common
import { Configuration, ConfigurationStore } from '../common/services/configuration';
// configuration server
import { InitializerConfigProvider } from './services/configuration';
import { EConfigurationProviders, PLUGIN_SETTINGS } from '../common/constants';
import { getUiSettingsDefinitions } from '../common/settings-adapter';

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
    // register the uiSetting to use in the public context (advanced settings)
    const uiSettingsDefs = getUiSettingsDefinitions(PLUGIN_SETTINGS)
    core.uiSettings.register(uiSettingsDefs);
   
    this.services.dashboardSecurity = createDashboardSecurity(plugins);
    this._internal.configurationStore = new ConfigurationStore(
      this.logger.get('configuration-store')
    );

    // add the initializer context config to the configuration store
    this._internal.configurationStore.registerProvider(
      EConfigurationProviders.PLUGIN_UI_SETTINGS,
      new InitializerConfigProvider(this.initializerContext)
    )
  
    // create the configuration service to use like a facede pattern
    this.services.configuration = new Configuration(
      this.logger.get('configuration'),
      this._internal.configurationStore,
    );

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
    // @ts-ignore
    // ToDo: check type of registerRouteHandlerContext "Argument of type '"wazuh_core"' is not assignable to parameter of type '"core""
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
    } as WazuhCorePluginSetup;
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
    } as WazuhCorePluginSetup;
  }

  public stop() {}
}
