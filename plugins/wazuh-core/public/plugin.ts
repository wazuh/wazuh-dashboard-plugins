import { WazuhCorePluginSetup, WazuhCorePluginStart } from './types';
import { setChrome, setCore, setUiSettings } from './plugin-services';
import { ConfigurationStore } from '../common/services/configuration/configuration-store';
import { DashboardSecurity } from './utils/dashboard-security';
import * as hooks from './hooks';
import { UISettingsConfigProvider } from './services/configuration/ui-settings-provider';
import { InitializerConfigProvider } from './services/configuration/initializer-context-provider';
import { EConfigurationProviders } from '../common/constants';
import {
  CoreSetup,
  CoreStart,
  Plugin,
  PluginInitializerContext,
} from 'opensearch-dashboards/public';
import { API_USER_STATUS_RUN_AS } from '../common/api-user-status-run-as';
import { Configuration } from '../common/services/configuration';
import * as utils from './utils';
import * as uiComponents from './components';
import { CoreHTTPClient } from './services/http/http-client';

const noop = () => {};

export class WazuhCorePlugin
  implements Plugin<WazuhCorePluginSetup, WazuhCorePluginStart>
{
  runtime = { setup: {} };
  internal: Record<string, any> = {};
  services: Record<string, any> = {};

  constructor(private initializerContext: PluginInitializerContext) {
    this.services = {};
    this.internal = {};
  }

  public async setup(core: CoreSetup): Promise<WazuhCorePluginSetup> {
    // No operation logger

    const logger = {
      info: noop,
      error: noop,
      debug: noop,
      warn: noop,
      trace: noop,
      fatal: noop,
      log: noop,
      get: () => logger,
    };
    this.internal.configurationStore = new ConfigurationStore(logger);

    this.internal.configurationStore.registerProvider(
      EConfigurationProviders.INITIALIZER_CONTEXT,
      new InitializerConfigProvider(this.initializerContext),
    );

    // register the uiSettins on the configuration store to avoid the use inside of configuration service
    this.internal.configurationStore.registerProvider(
      EConfigurationProviders.PLUGIN_UI_SETTINGS,
      new UISettingsConfigProvider(core.uiSettings),
    );

    console.log(
      'uiSettings',
      await this.internal.configurationStore.getProviderConfiguration(
        EConfigurationProviders.INITIALIZER_CONTEXT,
      ),
    );

    console.log('uiSettings core', core.uiSettings.getAll());

    console.log(
      'uiSettings from configuration',
      await this.internal.configurationStore.getProviderConfiguration(
        EConfigurationProviders.PLUGIN_UI_SETTINGS,
      ),
    );

    this.services.configuration = new Configuration(
      logger,
      this.internal.configurationStore,
    );

    console.log(
      'all config defined on wazuh core',
      await this.services.configuration.getAll(),
    );

    // Create dashboardSecurity
    this.services.dashboardSecurity = new DashboardSecurity(logger, core.http);

    // Create http
    this.services.http = new CoreHTTPClient(logger, {
      getTimeout: async () =>
        (await this.services.configuration.get('timeout')) as number,
      getURL: (path: string) => core.http.basePath.prepend(path),
      getServerAPI: () => 'imposter', // TODO: implement
      getIndexPatternTitle: async () => 'wazuh-alerts-*', // TODO: implement
      http: core.http,
    });

    // Setup services
    await this.services.dashboardSecurity.setup();
    this.runtime.setup.http = await this.services.http.setup({ core });

    return {
      ...this.services,
      utils,
      API_USER_STATUS_RUN_AS,
      ui: {
        ...uiComponents,
        ...this.runtime.setup.http.ui,
      },
    };
  }

  public async start(core: CoreStart): Promise<WazuhCorePluginStart> {
    setChrome(core.chrome);
    setCore(core);
    setUiSettings(core.uiSettings);

    // Start services
    await this.services.configuration.start({ http: core.http });
    await this.services.dashboardSecurity.start();
    await this.services.http.start();

    return {
      ...this.services,
      utils,
      API_USER_STATUS_RUN_AS,
      hooks,
      ui: {
        ...uiComponents,
        ...this.runtime.setup.http.ui,
      },
    };
  }

  public stop() {}
}
