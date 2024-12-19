import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from 'opensearch-dashboards/server';
import { validate as validateNodeCronInterval } from 'node-cron';
import {
  PLUGIN_PLATFORM_SETTING_NAME_MAX_BUCKETS,
  PLUGIN_PLATFORM_SETTING_NAME_METAFIELDS,
  PLUGIN_PLATFORM_SETTING_NAME_TIME_FILTER,
  PLUGIN_SETTINGS_CATEGORIES,
  WAZUH_CORE_CONFIGURATION_CACHE_SECONDS,
  WAZUH_DATA_CONFIG_APP_PATH,
  WAZUH_PLUGIN_PLATFORM_SETTING_MAX_BUCKETS,
  WAZUH_PLUGIN_PLATFORM_SETTING_METAFIELDS,
  WAZUH_PLUGIN_PLATFORM_SETTING_TIME_FILTER,
} from '../common/constants';
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
  InitializationService,
} from './services';
// configuration common
import { Configuration, ConfigurationStore } from '../common/services/configuration';
// configuration server
import { InitializerConfigProvider } from './services/configuration';
import { EConfigurationProviders, PLUGIN_SETTINGS } from '../common/constants';
import { getUiSettingsDefinitions } from '../common/settings-adapter';
import { initializationTaskCreatorServerAPIConnectionCompatibility } from './initialization/server-api';
import {
  initializationTaskCreatorExistTemplate,
  initializationTaskCreatorIndexPattern,
  initializationTaskCreatorSetting,
} from './initialization';
import alertsIndexPatternDefaultFields from './initialization/index-patterns-fields/alerts-fields.json';
import monitoringIndexPatternDefaultFields from './initialization/index-patterns-fields/monitoring-fields.json';
import statisticsIndexPatternDefaultFields from './initialization/index-patterns-fields/statistics-fields.json';
import vulnerabilitiesStatesFields from './initialization/index-patterns-fields/vulnerabibility-states-fields.json';

export class WazuhCorePlugin
  implements Plugin<WazuhCorePluginSetup, WazuhCorePluginStart>
{
  private readonly logger: Logger;
  private readonly services: Record<string, any>;
  private readonly internal: Record<string, any>;

  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
    this.services = {};
    this.internal = {};
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
    this.internal.configurationStore = new ConfigurationStore(
      this.logger.get('configuration-store')
    );

    // add the initializer context config to the configuration store
    this.internal.configurationStore.registerProvider(
      EConfigurationProviders.PLUGIN_UI_SETTINGS,
      new InitializerConfigProvider(this.initializerContext)
    )
  
    // create the configuration service to use like a facede pattern
    this.services.configuration = new Configuration(
      this.logger.get('configuration'),
      this.internal.configurationStore,
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

    this.services.initialization = new InitializationService(
      this.logger.get('initialization'),
      this.services,
    );

    this.services.initialization.setup({ core });

    // Register initialization tasks
    this.services.initialization.register(
      initializationTaskCreatorServerAPIConnectionCompatibility({
        taskName: 'check-server-api-connection-compatibility',
      }),
    );

    // Index pattern: alerts
    // TODO: this task should be registered by the related plugin
    this.services.initialization.register(
      initializationTaskCreatorIndexPattern({
        getIndexPatternID: ctx => ctx.configuration.get('pattern'),
        taskName: 'index-pattern:alerts',
        options: {
          savedObjectOverwrite: {
            timeFieldName: 'timestamp',
          },
          fieldsNoIndices: alertsIndexPatternDefaultFields,
        },
        configurationSettingKey: 'checks.pattern',
      }),
    );
    // Index pattern: monitoring
    // TODO: this task should be registered by the related plugin
    this.services.initialization.register(
      initializationTaskCreatorIndexPattern({
        getIndexPatternID: ctx =>
          ctx.configuration.get('wazuh.monitoring.pattern'),
        taskName: 'index-pattern:monitoring',
        options: {
          savedObjectOverwrite: {
            timeFieldName: 'timestamp',
          },
          fieldsNoIndices: monitoringIndexPatternDefaultFields,
        },
        configurationSettingKey: 'checks.monitoring', // TODO: create new setting
      }),
    );
    // Index pattern: vulnerabilities
    // TODO: this task should be registered by the related plugin
    this.services.initialization.register(
      initializationTaskCreatorIndexPattern({
        getIndexPatternID: ctx =>
          ctx.configuration.get('vulnerabilities.pattern'),
        taskName: 'index-pattern:vulnerabilities-states',
        options: {
          fieldsNoIndices: vulnerabilitiesStatesFields,
        },
        configurationSettingKey: 'checks.vulnerability', // TODO: create new setting
      }),
    );

    // Index pattern: statistics
    // TODO: this task should be registered by the related plugin
    this.services.initialization.register(
      initializationTaskCreatorIndexPattern({
        getIndexPatternID: async ctx => {
          const appConfig = await ctx.configuration.get(
            'cron.prefix',
            'cron.statistics.index.name',
          );
          const prefixTemplateName = appConfig['cron.prefix'];
          const statisticsIndicesTemplateName =
            appConfig['cron.statistics.index.name'];

          return `${prefixTemplateName}-${statisticsIndicesTemplateName}-*`;
        },
        taskName: 'index-pattern:statistics',
        options: {
          savedObjectOverwrite: {
            timeFieldName: 'timestamp',
          },
          fieldsNoIndices: statisticsIndexPatternDefaultFields,
        },
        configurationSettingKey: 'checks.statistics', // TODO: create new setting
      }),
    );

    // Settings
    // TODO: this task should be registered by the related plugin
    for (const setting of [
      {
        key: PLUGIN_PLATFORM_SETTING_NAME_MAX_BUCKETS,
        value: WAZUH_PLUGIN_PLATFORM_SETTING_MAX_BUCKETS,
        configurationSetting: 'checks.maxBuckets',
      },
      {
        key: PLUGIN_PLATFORM_SETTING_NAME_METAFIELDS,
        value: WAZUH_PLUGIN_PLATFORM_SETTING_METAFIELDS,
        configurationSetting: 'checks.metaFields',
      },
      {
        key: PLUGIN_PLATFORM_SETTING_NAME_TIME_FILTER,
        value: JSON.stringify(WAZUH_PLUGIN_PLATFORM_SETTING_TIME_FILTER),
        configurationSetting: 'checks.timeFilter',
      },
    ]) {
      this.services.initialization.register(
        initializationTaskCreatorSetting(setting, `setting:${setting.key}`),
      );
    }

    // Index pattern templates
    // Index pattern template: alerts
    // TODO: this task should be registered by the related plugin
    this.services.initialization.register(
      initializationTaskCreatorExistTemplate({
        getOpenSearchClient: ctx => ctx.core.opensearch.client.asInternalUser,
        getIndexPatternTitle: ctx => ctx.configuration.get('pattern'),
        taskName: 'index-pattern-template:alerts',
      }),
    );

    // Register a property to the context parameter of the endpoint handlers
    // @ts-ignore
    // ToDo: check type of registerRouteHandlerContext "Argument of type '"wazuh_core"' is not assignable to parameter of type '"core""
    core.http.registerRouteHandlerContext('wazuh_core', (context, request) => {
      return {
        ...this.services,
        logger: this.logger.get(
          `${request.route.method.toUpperCase()} ${request.route.path}`,
        ),
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
    await this.services.initialization.start({ core });

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
