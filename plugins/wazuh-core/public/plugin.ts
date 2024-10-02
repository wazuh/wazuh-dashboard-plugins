import { CoreSetup, CoreStart, Plugin } from 'opensearch-dashboards/public';
import { WazuhCorePluginSetup, WazuhCorePluginStart } from './types';
import { setChrome, setCore, setUiSettings } from './plugin-services';
import * as utils from './utils';
import * as uiComponents from './components';
import { API_USER_STATUS_RUN_AS } from '../common/api-user-status-run-as';
import { Configuration } from '../common/services/configuration';
import { ConfigurationStore } from './utils/configuration-store';
import {
  PLUGIN_SETTINGS,
  PLUGIN_SETTINGS_CATEGORIES,
} from '../common/constants';
import { DashboardSecurity } from './utils/dashboard-security';
import * as hooks from './hooks';
import { CoreHTTPClient } from './services/http/http-client';

export class WazuhCorePlugin
  implements Plugin<WazuhCorePluginSetup, WazuhCorePluginStart>
{
  runtime = { setup: {} };
  _internal: { [key: string]: any } = {};
  services: { [key: string]: any } = {};
  public async setup(core: CoreSetup): Promise<WazuhCorePluginSetup> {
    const noop = () => {};
    // Debug logger
    const consoleLogger = {
      info: console.log,
      error: console.error,
      debug: console.debug,
      warn: console.warn,
    };
    // No operation logger
    const noopLogger = {
      info: noop,
      error: noop,
      debug: noop,
      warn: noop,
    };
    const logger = noopLogger;
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
