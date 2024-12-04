import { CoreSetup, CoreStart, Plugin, PluginInitializerContext } from 'opensearch-dashboards/public';
import { WazuhCorePluginSetup, WazuhCorePluginStart } from './types';
import { setChrome, setCore, setUiSettings } from './plugin-services';
import * as utils from './utils';
import { API_USER_STATUS_RUN_AS } from '../common/api-user-status-run-as';
import { Configuration } from '../common/services/configuration';
import { ConfigurationStore } from './utils/configuration-store';
import {
  PLUGIN_SETTINGS,
  PLUGIN_SETTINGS_CATEGORIES,
} from '../common/constants';
import { DashboardSecurity } from './utils/dashboard-security';
import * as hooks from './hooks';

export class WazuhCorePlugin
  implements Plugin<WazuhCorePluginSetup, WazuhCorePluginStart>
{
  _internal: { [key: string]: any } = {};
  services: { [key: string]: any } = {};

  constructor(private readonly initializerContext: PluginInitializerContext) {}


  public async setup(core: CoreSetup): Promise<WazuhCorePluginSetup> {
    const noop = () => {};
    const logger = {
      info: noop,
      error: noop,
      debug: noop,
      warn: noop,
    };
    this._internal.configurationStore = new ConfigurationStore(
      logger,
      core.http,
    );
    this.services.configuration = new Configuration(
      logger,
      this._internal.configurationStore,
    );
    // Register the plugin settings
    Object.entries(PLUGIN_SETTINGS).forEach(([key, value]) =>
      this.services.configuration.register(key, value),
    );

    // Add categories to the configuration
    Object.entries(PLUGIN_SETTINGS_CATEGORIES).forEach(([key, value]) => {
      this.services.configuration.registerCategory({ ...value, id: key });
    });

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
