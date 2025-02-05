import {
  CoreSetup,
  CoreStart,
  Plugin,
  PluginInitializerContext,
} from 'opensearch-dashboards/public';
import { Cookies } from 'react-cookie';
import { Logger } from '@osd/logging';
import { ConfigurationStore } from '../common/services/configuration/configuration-store';
import { EConfigurationProviders } from '../common/constants';
import { API_USER_STATUS_RUN_AS } from '../common/api-user-status-run-as';
import { Configuration } from '../common/services/configuration';
import { NoopLogger } from '../common/logger/noop-logger';
import { WazuhCorePluginSetup, WazuhCorePluginStart } from './types';
import { setChrome, setCore, setUiSettings } from './plugin-services';
import { UISettingsConfigProvider } from './services/configuration/ui-settings-provider';
import { InitializerConfigProvider } from './services/configuration/initializer-context-provider';
import * as utils from './utils';
import * as uiComponents from './components';
import {
  DashboardSecurity,
  DashboardSecurityServiceSetupReturn,
} from './services/dashboard-security';
import * as hooks from './hooks';
import { CoreState, State, StateSetupReturn } from './services/state';
import { ServerHostClusterInfoStateContainer } from './services/state/containers/server-host-cluster-info';
import { ServerHostStateContainer } from './services/state/containers/server-host';
import { DataSourceAlertsStateContainer } from './services/state/containers/data-source-alerts';
import { CoreServerSecurity, ServerSecurity } from './services';
import { CoreHTTPClient } from './services/http/http-client';
import { ApplicationService } from './services/application/application';

interface RuntimeSetup {
  dashboardSecurity: DashboardSecurityServiceSetupReturn;
  http: Awaited<ReturnType<CoreHTTPClient['setup']>>;
  serverSecurity: Awaited<ReturnType<ServerSecurity['setup']>>;
  state: StateSetupReturn;
}

interface Runtime {
  setup: RuntimeSetup;
  start: Record<string, any>;
}

export class WazuhCorePlugin
  implements Plugin<WazuhCorePluginSetup, WazuhCorePluginStart>
{
  runtime: Runtime;
  internal: Record<string, any>;
  services: {
    applicationService: ApplicationService;
    configuration: Configuration;
    dashboardSecurity: DashboardSecurity;
    http: CoreHTTPClient;
    serverSecurity: ServerSecurity;
    state: State;
  };

  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.runtime = {
      // @ts-expect-error Type '{}' is missing some properties
      setup: {},
      start: {},
    };
    // @ts-expect-error Type '{}' is missing some properties
    this.services = {};
    this.internal = {};
  }

  public async setup(core: CoreSetup): Promise<WazuhCorePluginSetup> {
    // No operation logger

    const logger: Logger = new NoopLogger();

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

    this.services.applicationService = new ApplicationService(logger);

    this.services.configuration = new Configuration(
      logger,
      this.internal.configurationStore,
    );

    // Create dashboardSecurity
    this.services.dashboardSecurity = new DashboardSecurity(logger, core.http);

    // Create state
    this.services.state = new CoreState(logger) as unknown as State;

    const cookiesStore = new Cookies();

    this.services.state.register(
      'server_host_cluster_info',
      new ServerHostClusterInfoStateContainer(logger, { store: cookiesStore }),
    );
    this.services.state.register(
      'server_host',
      new ServerHostStateContainer(logger, { store: cookiesStore }),
    );
    this.services.state.register(
      'data_source_alerts',
      new DataSourceAlertsStateContainer(logger, { store: cookiesStore }),
    );

    this.services.serverSecurity = new CoreServerSecurity(logger);

    // Create http
    this.services.http = new CoreHTTPClient(logger, {
      getTimeout: async () =>
        (await this.services.configuration.get('timeout')) as number,
      getURL: (path: string) => core.http.basePath.prepend(path),
      getServerAPI: () => this.services.state.get('server_host').id,
      getIndexPatternTitle: async () =>
        this.services.state.get('data_source_alerts'),
      http: core.http,
    });

    // Setup services
    this.runtime.setup.state = this.services.state.setup();
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
        ...this.runtime.setup.state.hooks,
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
    this.services.state.start();
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
        ...this.runtime.setup.state.hooks,
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

  public stop() {
    this.services.state.stop();
  }
}
