import { AppMountParameters, CoreSetup, CoreStart, AppUpdater, Plugin, PluginInitializerContext } from 'opensearch_dashboards/public';
import {
  AppPluginStartDependencies,
  WazuhSetup,
  WazuhSetupPlugins,
  WazuhStart,
  WazuhStartPlugins,
} from '../types';
import {
  setDataPlugin,
  setHttp,
  setToasts,
  setUiSettings,
  setChrome,
  setAngularModule,
  setNavigationPlugin,
  setVisualizationsPlugin,
  setSavedObjects,
  setOverlays,
  setScopedHistory,
  setCore,
  setPlugins,
  setCookies,
} from '../kibana-services';
import { getThemeAssetURL, getAssetURL } from '../utils/assets';
import { initializeInterceptor, unregisterInterceptor } from '../services/request-handler';

import { setErrorOrchestrator } from '../react-services/common-services';
import { ErrorOrchestratorService } from '../react-services/error-orchestrator/error-orchestrator.service';

export default class AppsHandler {
  constructor() { }

  private _SIDEBAR_LOGO = 'customization.logo.sidebar';
  private _UI_THEME = 'light';
  private _core = null;
  private _isWazuhDisabled = 0;
  private _logosInitialState = {};
  private _initializeInnerAngular?: () => void;
  private _innerAngularInitialized: boolean = false;
  private _hideTelemetryBanner?: () => void;
  private _innerAngularName = 'app/wazuh';

  /**
   * Sets the setup core object to be used in the app setup process.
   * @param core
   */
  public async setSetupCore(core: CoreSetup) {
    this._core = core;
  }

  /**
   * Sets the UI theme to be used in the application.
   */
  public initUITheme() {
    this._UI_THEME = this._core.uiSettings.get('theme:darkMode') ? 'dark' : 'light';
  }

  /**
   * Check if Wazuh is disabled by making a request to the backend.
   * If it is disabled, the application will not be registered.
   * Checks if the logged in user has the RBAC disable role.
   */
  public async setIsWazuhDisabled() {
    //Check if user has wazuh disabled and avoid registering the application if not
    try {
      const { isWazuhDisabled } = await this._core.http.get('/api/check-wazuh');
      this._isWazuhDisabled = isWazuhDisabled || 0;
    }
    catch (error) {
      console.error('plugin.ts: Error checking if Wazuh is enabled', error);
      this._isWazuhDisabled = 1;
    }
  }

  /**
   * Get the custom logos configuration from the backend.
   */
  public async initLogos() {
    try {
      this._logosInitialState = await this._core.http.get(`/api/logos`);
    }
    catch (error) {
      console.error('plugin.ts: Error getting logos configuration', error);
    }
  }

  /**
   *
   * @returns the main logo to be used in the app
   */
  public getMainLogo(): string {
    return this._core.http.basePath.prepend(this._logosInitialState?.logos?.[this._SIDEBAR_LOGO] ? getAssetURL(this._logosInitialState?.logos?.[this._SIDEBAR_LOGO]) : getThemeAssetURL('icon.svg', this._UI_THEME))
  }

  /**
   * Method to be executed in the setup lifecycle of the plugin. It registers the apps of the plugin.
   * @param apps array of apps configuration to be registered
   */
  public registerApps(apps: []) {
    if (!this._isWazuhDisabled) {
      apps.forEach((app: Object, key: number) => {
        // New module app registration
        this._core.application.register({
          ...app,
          icon: this.getMainLogo(),
          mount: async (params) => {

            // hide the telemetry banner.
            // Set the flag in the telemetry saved object as the notice was seen and dismissed
            this._hideTelemetryBanner && await this._hideTelemetryBanner();

            //Intercept request and validate session
            initializeInterceptor(this._core);

            //Mount the app
            const unmount = await app.mount({
              core: this._core,
              params,
              euiIconType: this.getMainLogo(),
              logos: this._logosInitialState?.logos,
              initializeInnerAngular: () => this._initializeInnerAngular(),
              // stateUpdater: this._stateUpdater,
            });
            return () => {
              unregisterInterceptor();
              unmount();
            };
          },
          category: {
            id: 'wazuh',
            label: 'Wazuh',
            order: key,
            euiIconType: this.getMainLogo(),
          },
        });
      });
    }
  }

  /**
   * Method to be executed in the start lifecycle of the plugin
   * @param core
   * @param plugins
   * @param initializerContext
   */
  public startApps(core: CoreStart, plugins: AppPluginStartDependencies, initializerContext: PluginInitializerContext) {

    // hide security alert
    if (plugins.securityOss) {
      plugins.securityOss.insecureCluster.hideAlert(true);
    };

    if (plugins?.telemetry?.telemetryNotifications?.setOptedInNoticeSeen) {
      // assign to a method to hide the telemetry banner used when the app is mounted
      this._hideTelemetryBanner = () => plugins.telemetry.telemetryNotifications.setOptedInNoticeSeen();
    };
    // we need to register the application service at setup, but to render it
    // there are some start dependencies necessary, for this reason
    // initializeInnerAngular + initializeServices are assigned at start and used
    // when the application/embeddable is mounted
    this._initializeInnerAngular = async () => {
      if (this._innerAngularInitialized) {
        return;
      }
      // this is used by application mount and tests
      const { getInnerAngularModule } = await import('../get_inner_angular');
      const module = getInnerAngularModule(
        this._innerAngularName,
        core,
        plugins,
        initializerContext
      );
      setAngularModule(module);
      this._innerAngularInitialized = true;
    };
    setCore(core);
    setPlugins(plugins);
    setHttp(core.http);
    setToasts(core.notifications.toasts);
    setDataPlugin(plugins.data);
    setUiSettings(core.uiSettings);
    setChrome(core.chrome);
    setNavigationPlugin(plugins.navigation);
    setVisualizationsPlugin(plugins.visualizations);
    setSavedObjects(core.savedObjects);
    setOverlays(core.overlays);
    setErrorOrchestrator(ErrorOrchestratorService);
  }
}
