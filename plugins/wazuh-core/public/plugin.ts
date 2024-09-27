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
import { CoreServerSecurity } from './services';
import { BehaviorSubject } from 'rxjs';

export class WazuhCorePlugin
  implements Plugin<WazuhCorePluginSetup, WazuhCorePluginStart>
{
  _internal: { [key: string]: any } = {};
  runtime: { [key: string]: any } = {
    setup: {},
  };
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

    // TODO: replace by the current session data
    let userSessionData = {
      account: {
        administrator: false,
        administrator_requirements: '',
      },
      policies: { rbac_mode: 'white' },
    };
    const userSession$ = new BehaviorSubject(userSessionData);

    this.services.serverSecurity = new CoreServerSecurity(logger, {
      getUserPermissions: () => {}, // TODO: implement
    });

    await this.services.dashboardSecurity.setup();

    this.runtime.securityServer = this.services.serverSecurity.setup({
      userSession$: userSession$, // TODO: replace
      getUserSession: () => userSessionData, // TODO: replace
      useLoadingLogo: () => {
        // TODO: implement
        // const {
        //   ['customization.logo.app']: customlogoApp,
        //   ['customization.enabled']: customizationEnabled,
        // } = useConfiguration();
        // const customImage = customizationEnabled && customlogoApp;
        // const imageSrc = getHttp().basePath.prepend(
        //   customImage
        //     ? getAssetURL(customImage)
        //     : getThemeAssetURL('logo.svg'),
        // );
      },
    });

    return {
      ...this.services,
      utils,
      API_USER_STATUS_RUN_AS,
      hooks: {
        ...hooks,
        ...this.runtime.setup.securityServer.hooks,
      },
      hocs: {
        ...this.runtime.setup.securityServer.hocs,
      },
      ui: {
        ...this.runtime.setup.securityServer.ui,
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
      hooks: {
        ...hooks,
        ...this.runtime.setup.securityServer.hooks,
      },
      hocs: {
        ...this.runtime.setup.securityServer.hocs,
      },
      ui: {
        ...this.runtime.setup.securityServer.ui,
      },
    };
  }

  public stop() {}
}
