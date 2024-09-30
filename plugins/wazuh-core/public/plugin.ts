import { CoreSetup, CoreStart, Plugin } from 'opensearch-dashboards/public';
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
import { CoreState, State } from './services/state';
import { ServerHostClusterInfoStateContainer } from './services/state/containers/server-host-cluster-info';
import { Cookies } from 'react-cookie';
import { ServerHostStateContainer } from './services/state/containers/server-host';
import { DataSourceAlertsStateContainer } from './services/state/containers/data-source-alerts';

export class WazuhCorePlugin
  implements Plugin<WazuhCorePluginSetup, WazuhCorePluginStart>
{
  runtime: { [key: string]: any } = {
    state: {},
  };
  _internal: { [key: string]: any } = {};
  services: {
    [key: string]: any;
    dashboardSecurity?: DashboardSecurity;
    state?: State;
  } = {};
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
    this.services.state.subscribe('server_host', value => {
      // TODO: refresh the auth when the server_host data changed
    });
    this.services.state.register(
      'data_source_alerts',
      new DataSourceAlertsStateContainer(logger, { store: cookiesStore }),
    );

    console.log(this.services.state.get('server_host'));

    await this.services.dashboardSecurity.setup();

    return {
      ...this.services,
      utils,
      API_USER_STATUS_RUN_AS,
      hooks: {
        ...this.runtime.state.setup.hooks,
      },
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
      // hooks,
      hooks: {
        ...hooks,
        ...this.runtime.state.setup.hooks,
      },
    };
  }

  public stop() {}
}
