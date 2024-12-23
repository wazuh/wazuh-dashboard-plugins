import { CoreSetup, CoreStart, Plugin } from 'opensearch-dashboards/public';
import { API_USER_STATUS_RUN_AS } from '../common/api-user-status-run-as';
import { Configuration } from '../common/services/configuration';
import {
  PLUGIN_SETTINGS,
  PLUGIN_SETTINGS_CATEGORIES,
} from '../common/constants';
import { WazuhCorePluginSetup, WazuhCorePluginStart } from './types';
import { setChrome, setCore, setUiSettings } from './plugin-services';
import * as utils from './utils';
import * as uiComponents from './components';
import { ConfigurationStore } from './utils/configuration-store';
import { DashboardSecurity } from './services/dashboard-security';
import * as hooks from './hooks';
import { CoreServerSecurity } from './services';
import { CoreHTTPClient } from './services/http/http-client';

const noop = () => {};

export class WazuhCorePlugin
  implements Plugin<WazuhCorePluginSetup, WazuhCorePluginStart>
{
  runtime: Record<string, any> = { setup: {}, start: {} };
  internal: Record<string, any> = {};
  services: Record<string, any> = {};

  public async setup(core: CoreSetup): Promise<WazuhCorePluginSetup> {
    // No operation logger
    const noopLogger = {
      info: noop,
      error: noop,
      debug: noop,
      warn: noop,
    };
    const logger = noopLogger;

    this.internal.configurationStore = new ConfigurationStore(
      logger,
      core.http,
    );
    this.services.configuration = new Configuration(
      logger,
      this.internal.configurationStore,
    );

    // Register the plugin settings
    for (const [key, value] of Object.entries(PLUGIN_SETTINGS)) {
      this.services.configuration.register(key, value);
    }

    // Add categories to the configuration
    for (const [key, value] of Object.entries(PLUGIN_SETTINGS_CATEGORIES)) {
      this.services.configuration.registerCategory({ ...value, id: key });
    }

    // Create dashboardSecurity
    this.services.dashboardSecurity = new DashboardSecurity(logger, core.http);

    this.services.serverSecurity = new CoreServerSecurity(logger);

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
    this.runtime.setup.dashboardSecurity =
      await this.services.dashboardSecurity.setup({
        updateData$: this.services.http.server.auth$,
      });
    this.runtime.setup.http = await this.services.http.setup({ core });

    this.runtime.setup.serverSecurity = this.services.serverSecurity.setup({
      useDashboardSecurityAccount:
        this.runtime.setup.dashboardSecurity.hooks.useDashboardSecurityIsAdmin,
      auth$: this.services.http.server.auth$,
      useLoadingLogo: () =>
        this.runtime.start.serverSecurityDeps.chrome.logos.AnimatedMark,
    });

    return {
      ...this.services,
      utils,
      API_USER_STATUS_RUN_AS,
      hooks: {
        ...hooks,
        ...this.runtime.setup.dashboardSecurity.hooks,
        ...this.runtime.setup.serverSecurity.hooks,
      },
      hocs: {
        ...this.runtime.setup.dashboardSecurity.hocs,
        ...this.runtime.setup.serverSecurity.hocs,
      },
      ui: {
        ...uiComponents,
        ...this.runtime.setup.http.ui,
        ...this.runtime.setup.serverSecurity.ui,
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

    this.runtime.start.serverSecurityDeps = {
      chrome: core.chrome,
    };

    return {
      ...this.services,
      utils,
      API_USER_STATUS_RUN_AS,
      hooks: {
        ...hooks,
        ...this.runtime.setup.dashboardSecurity.hooks,
        ...this.runtime.setup.serverSecurity.hooks,
      },
      hocs: {
        ...this.runtime.setup.dashboardSecurity.hocs,
        ...this.runtime.setup.serverSecurity.hocs,
      },
      ui: {
        ...uiComponents,
        ...this.runtime.setup.http.ui,
        ...this.runtime.setup.serverSecurity.ui,
      },
    };
  }

  public stop() {}
}
