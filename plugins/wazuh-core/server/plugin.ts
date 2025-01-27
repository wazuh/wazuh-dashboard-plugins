import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from 'opensearch-dashboards/server';
import {
  PLUGIN_PLATFORM_SETTING_NAME_MAX_BUCKETS,
  PLUGIN_PLATFORM_SETTING_NAME_METAFIELDS,
  PLUGIN_PLATFORM_SETTING_NAME_TIME_FILTER,
  WAZUH_PLUGIN_PLATFORM_SETTING_MAX_BUCKETS,
  WAZUH_PLUGIN_PLATFORM_SETTING_METAFIELDS,
  WAZUH_PLUGIN_PLATFORM_SETTING_TIME_FILTER,
  EConfigurationProviders,
  PLUGIN_SETTINGS,
} from '../common/constants';
import {
  Configuration,
  ConfigurationStore,
} from '../common/services/configuration';
import { getUiSettingsDefinitions } from '../common/settings-adapter';
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
// configuration server
import { InitializerConfigProvider } from './services/configuration';
import { initializationTaskCreatorServerAPIConnectionCompatibility } from './initialization/server-api';
import {
  initializationTaskCreatorExistTemplate,
  initializationTaskCreatorIndexPattern,
  initializationTaskCreatorSetting,
} from './initialization';
import monitoringIndexPatternDefaultFields from './initialization/index-patterns-fields/monitoring-fields.json';
import statisticsIndexPatternDefaultFields from './initialization/index-patterns-fields/statistics-fields.json';
import indexPatternFieldsAgent from './initialization/index-patterns-fields/fields-agent.json';
import indexPatternFieldsAlerts from './initialization/index-patterns-fields/fields-alerts.json';
import indexPatternFieldsCommands from './initialization/index-patterns-fields/fields-commands.json';
import indexPatternFieldsFim from './initialization/index-patterns-fields/fields-fim.json';
import indexPatternFieldsHardware from './initialization/index-patterns-fields/fields-hardware.json';
import indexPatternFieldsHotfixes from './initialization/index-patterns-fields/fields-hotfixes.json';
import indexPatternFieldsNetworks from './initialization/index-patterns-fields/fields-networks.json';
import indexPatternFieldsPackages from './initialization/index-patterns-fields/fields-packages.json';
import indexPatternFieldsPorts from './initialization/index-patterns-fields/fields-ports.json';
import indexPatternFieldsProcesses from './initialization/index-patterns-fields/fields-processes.json';
import indexPatternFieldsSystem from './initialization/index-patterns-fields/fields-system.json';
import indexPatternFieldsVulnerabilities from './initialization/index-patterns-fields/fields-vulnerabilities.json';

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
    const uiSettingsDefs = getUiSettingsDefinitions(PLUGIN_SETTINGS);

    core.uiSettings.register(uiSettingsDefs);

    this.services.dashboardSecurity = createDashboardSecurity(plugins);
    this.internal.configurationStore = new ConfigurationStore(
      this.logger.get('configuration-store'),
    );

    // add the initializer context config to the configuration store
    this.internal.configurationStore.registerProvider(
      EConfigurationProviders.PLUGIN_UI_SETTINGS,
      new InitializerConfigProvider(this.initializerContext),
    );

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
        getIndexPatternID: async () => 'wazuh-alerts-5.x-*', // TODO: this should use a static value or configurable setting in the server side
        taskName: 'index-pattern:alerts',
        options: {
          savedObjectOverwrite: {
            timeFieldName: '@timestamp',
          },
          fieldsNoIndices: indexPatternFieldsAlerts,
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
        getIndexPatternID: async () => 'wazuh-states-vulnerabilities*', // TODO: this should use a static value or configurable setting in the server side
        taskName: 'index-pattern:states-vulnerabilities',
        options: {
          fieldsNoIndices: indexPatternFieldsVulnerabilities,
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

    // TODO: this task should be registered by the related plugin
    /*
      Temporal: we register the index pattern initialization tasks using a static fields definition.
                We could retrieve tihs data from the template indexed by Wazuh indexer and
                transform into the index pattern field format
    */

    for (const {
      indexPattern,
      taskIndexPattern,
      timeFieldName,
      fieldsNoIndices,
      configurationSettingKey,
    } of [
      {
        indexPattern: 'wazuh-agents*',
        taskIndexPattern: 'agents',
        fieldsNoIndices: indexPatternFieldsAgent,
        configurationSettingKey: '',
      },
      {
        indexPattern: 'wazuh-commands*',
        taskIndexPattern: 'commands',
        fieldsNoIndices: indexPatternFieldsCommands,
        configurationSettingKey: '',
      },
      {
        indexPattern: 'wazuh-states-fim*',
        taskIndexPattern: 'states-fim',
        fieldsNoIndices: indexPatternFieldsFim,
        configurationSettingKey: '',
      },
      {
        indexPattern: 'wazuh-states-inventory-hardware*',
        taskIndexPattern: 'states-inventory-hardware',
        fieldsNoIndices: indexPatternFieldsHardware,
        configurationSettingKey: '',
      },
      {
        indexPattern: 'wazuh-states-inventory-hotfixes*',
        taskIndexPattern: 'states-inventory-hotfixes',
        fieldsNoIndices: indexPatternFieldsHotfixes,
        configurationSettingKey: '',
      },
      {
        indexPattern: 'wazuh-states-inventory-networks*',
        taskIndexPattern: 'states-inventory-networks',
        fieldsNoIndices: indexPatternFieldsNetworks,
        configurationSettingKey: '',
      },
      {
        indexPattern: 'wazuh-states-inventory-packages*',
        taskIndexPattern: 'states-inventory-packages',
        fieldsNoIndices: indexPatternFieldsPackages,
        configurationSettingKey: '',
      },
      {
        indexPattern: 'wazuh-states-inventory-ports*',
        taskIndexPattern: 'states-inventory-ports',
        fieldsNoIndices: indexPatternFieldsPorts,
        configurationSettingKey: '',
      },
      {
        indexPattern: 'wazuh-states-inventory-system*',
        taskIndexPattern: 'states-system',
        fieldsNoIndices: indexPatternFieldsSystem,
        configurationSettingKey: '',
      },
      {
        indexPattern: 'wazuh-states-inventory-processes*',
        taskIndexPattern: 'states-inventory-processes',
        fieldsNoIndices: indexPatternFieldsProcesses,
        configurationSettingKey: '',
      },
    ] as {
      indexPattern: string;
      taskIndexPattern: string;
      timeFieldName?: string;
      fieldsNoIndices?: object;
      configurationSettingKey: string;
    }[]) {
      this.services.initialization.register(
        initializationTaskCreatorIndexPattern({
          getIndexPatternID: async () => indexPattern, // TODO: this should use a static value or configurable setting in the server side
          taskName: `index-pattern:${taskIndexPattern}`,
          options: {
            ...(timeFieldName
              ? {
                  savedObjectOverwrite: {
                    timeFieldName,
                  },
                }
              : {}),
            ...(fieldsNoIndices ? { fieldsNoIndices } : {}),
          },
          configurationSettingKey: configurationSettingKey, // TODO: setting placehodler, create new setting
        }),
      );
    }

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
    core.http.registerRouteHandlerContext('wazuh_core', (context, request) => ({
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
    }));

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
