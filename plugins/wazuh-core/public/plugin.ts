import { CoreSetup, CoreStart, Plugin } from 'opensearch-dashboards/public';
import { WazuhCorePluginSetup, WazuhCorePluginStart } from './types';
import { setChrome, setCore, setUiSettings } from './plugin-services';
import * as utils from './utils';
import { API_USER_STATUS_RUN_AS } from '../common/api-user-status-run-as';
import { Configuration } from '../common/services/configuration';
import { ConfigurationStore } from './utils/configuration-store';
import { DashboardSecurity } from './utils/dashboard-security';
import * as hooks from './hooks';
import { UISettingsConfigProvider } from './services/configuration/ui-settings-provider';
import { uiSettings } from '../server/services/configuration/ui_settings';

export class WazuhCorePlugin
  implements Plugin<WazuhCorePluginSetup, WazuhCorePluginStart>
{
  _internal: { [key: string]: any } = {};
  services: { [key: string]: any } = {};

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

    // register the uiSettins on the configuration store to avoid the use inside of configuration service
    this._internal.configurationStore.registerProvider(
      'uiSettings',
      new UISettingsConfigProvider(core.uiSettings, uiSettings)
    );


    this.services.configuration = new Configuration(
      logger,
      this._internal.configurationStore,
    );

    this.services.dashboardSecurity = new DashboardSecurity(logger, core.http);

    await this.services.dashboardSecurity.setup();

    return {
      ...this.services,
      utils,
      API_USER_STATUS_RUN_AS,
    } as WazuhCorePluginSetup;
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
    } as WazuhCorePluginStart;
  }

  public stop() {}
}
