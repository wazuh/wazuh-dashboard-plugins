import {
  CoreSetup,
  CoreStart,
  Plugin,
  PluginInitializerContext,
} from 'opensearch-dashboards/public';
import { WazuhCorePluginSetup, WazuhCorePluginStart } from './types';
import { setChrome, setCore, setUiSettings } from './plugin-services';
import * as utils from './utils';
import { API_USER_STATUS_RUN_AS } from '../common/api-user-status-run-as';
import { Configuration } from '../common/services/configuration';
import { ConfigurationStore } from '../common/services/configuration/configuration-store';
import { EConfigurationProviders } from '../common/constants';
import { UISettingsConfigProvider } from './services/configuration/ui-settings-provider';
import { InitializerConfigProvider } from './services/configuration/initializer-context-provider';
import { DashboardSecurity } from './utils/dashboard-security';
import * as hooks from './hooks';

export class WazuhCorePlugin
  implements Plugin<WazuhCorePluginSetup, WazuhCorePluginStart>
{
  _internal: { [key: string]: any } = {};
  services: { [key: string]: any } = {};
  // runtime: Record<string, any> = { setup: {}, start: {} };
  // internal: Record<string, any> = {};
  // services: Record<string, any> = {};

  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.services = {};
    this._internal = {};
  }

  public async setup(core: CoreSetup): Promise<WazuhCorePluginSetup> {
    // No operation logger
    const noop = () => {};
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

    this._internal.configurationStore = new ConfigurationStore(logger);

    this._internal.configurationStore.registerProvider(
      EConfigurationProviders.INITIALIZER_CONTEXT,
      new InitializerConfigProvider(this.initializerContext),
    );

    // register the uiSettins on the configuration store to avoid the use inside of configuration service
    this._internal.configurationStore.registerProvider(
      EConfigurationProviders.PLUGIN_UI_SETTINGS,
      new UISettingsConfigProvider(core.uiSettings),
    );

    this.services.configuration = new Configuration(
      logger,
      this._internal.configurationStore,
    );

    // Create dashboardSecurity
    this.services.dashboardSecurity = new DashboardSecurity(logger, core.http);

    await this.services.dashboardSecurity.setup();

    return {
      ...this.services,
      utils,
      API_USER_STATUS_RUN_AS,
    };
  }

  public async start(core: CoreStart): Promise<WazuhCorePluginStart> {
    setChrome(core.chrome);
    setCore(core);
    setUiSettings(core.uiSettings);

    await this.services.configuration.start({ http: core.http });

    return {
      ...this.services,
      utils,
      API_USER_STATUS_RUN_AS,
      hooks,
    };
  }

  public stop() {}
}
