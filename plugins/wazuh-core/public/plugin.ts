import { CoreSetup, CoreStart, Plugin } from 'opensearch-dashboards/public';
import { Cookies } from 'react-cookie';
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
import { DashboardSecurity } from './utils/dashboard-security';
import * as hooks from './hooks';
import { CoreState, State } from './services/state';
import { ServerHostClusterInfoStateContainer } from './services/state/containers/server-host-cluster-info';
import { ServerHostStateContainer } from './services/state/containers/server-host';
import { DataSourceAlertsStateContainer } from './services/state/containers/data-source-alerts';
import { CoreHTTPClient } from './services/http/http-client';

const noop = () => {};

export class WazuhCorePlugin
  implements Plugin<WazuhCorePluginSetup, WazuhCorePluginStart>
{
  runtime: Record<string, any> = {
    state: {},
  };
  internal: Record<string, any> = {};
  services: {
    [key: string]: any;
    dashboardSecurity?: DashboardSecurity;
    state?: State;
  } = {};

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

    // Create state
    this.services.state = new CoreState(logger);

    this.runtime.state.setup = this.services.state.setup();

    const cookiesStore = new Cookies();

    this.services.state.register(
      'server_host_cluster_info',
      new ServerHostClusterInfoStateContainer(logger, { store: cookiesStore }),
    );
    this.services.state.register(
      'server_host',
      new ServerHostStateContainer(logger, { store: cookiesStore }),
    );
    this.services.state.subscribe('server_host', (_value: string) => {
      // TODO: refresh the auth when the server_host data changed and there is value
    });
    this.services.state.register(
      'data_source_alerts',
      new DataSourceAlertsStateContainer(logger, { store: cookiesStore }),
    );

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
      hooks: {
        ...hooks,
        ...this.runtime.state.setup.hooks,
      },
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
    this.services.state.start();
    await this.services.dashboardSecurity.start();
    await this.services.http.start();

    return {
      ...this.services,
      utils,
      API_USER_STATUS_RUN_AS,
      hooks: {
        ...hooks,
        ...this.runtime.state.setup.hooks,
      },
      ui: {
        ...uiComponents,
        ...this.runtime.setup.http.ui,
      },
    };
  }

  public stop() {
    this.services.state.stop();
  }
}
