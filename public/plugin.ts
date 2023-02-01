import { BehaviorSubject } from 'rxjs';
import { AppMountParameters, CoreSetup, CoreStart, AppUpdater, Plugin, PluginInitializerContext } from 'opensearch_dashboards/public';
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
} from './kibana-services';
import {
  AppPluginStartDependencies,
  WazuhSetup,
  WazuhSetupPlugins,
  WazuhStart,
  WazuhStartPlugins,
} from './types';
import { Cookies } from 'react-cookie';
import { AppState } from './react-services/app-state';
import { setErrorOrchestrator } from './react-services/common-services';
import { ErrorOrchestratorService } from './react-services/error-orchestrator/error-orchestrator.service';
import store from './redux/store';
import { updateAppConfig } from './redux/actions/appConfigActions';
import { initializeInterceptor, unregisterInterceptor } from './services/request-handler';
import AppsRegister from './apps/apps-handler';
import appMetrics from './apps/metrics';
import appWazuh from './apps/wazuh-app';

const SIDEBAR_LOGO = 'customization.logo.sidebar';
const innerAngularName = 'app/wazuh';

export class WazuhPlugin implements Plugin<WazuhSetup, WazuhStart, WazuhSetupPlugins, WazuhStartPlugins> {
  constructor(private readonly initializerContext: PluginInitializerContext) { }
  public initializeInnerAngular?: () => void;
  private innerAngularInitialized: boolean = false;
  private stateUpdater = new BehaviorSubject<AppUpdater>(() => ({}));
  private hideTelemetryBanner?: () => void;

  public async setup(core: CoreSetup, plugins: WazuhSetupPlugins): WazuhSetup {

    const appsRegister = new AppsRegister(core);
    await appsRegister.initLogos();
    await appsRegister.setIsWazuhDisabled();

    const apps = [
      appMetrics(),
      appWazuh({
        initializeInnerAngular: this.initializeInnerAngular,
        stateUpdater: this.stateUpdater,
      })
    ];
    appsRegister.registerApps({
      apps,
      hideTelemetryBanner: this.hideTelemetryBanner
    });
    // core.application.register({
    //   id: `wazuh`,
    //   title: 'Wazuh',
    //   icon: core.http.basePath.prepend(
    //     logosInitialState?.logos?.[SIDEBAR_LOGO] ?
    //       getAssetURL(logosInitialState?.logos?.[SIDEBAR_LOGO]) :
    //       getThemeAssetURL('icon.svg', UI_THEME)),
    //   mount: async (params: AppMountParameters) => {
    //     try {
    //       initializeInterceptor(core);
    //       if (!this.initializeInnerAngular) {
    //         throw Error('Wazuh plugin method initializeInnerAngular is undefined');
    //       }

    //       // Update redux app state logos with the custom logos
    //       if (logosInitialState?.logos) {
    //         store.dispatch(updateAppConfig(logosInitialState.logos));
    //       }
    //       // hide the telemetry banner.
    //       // Set the flag in the telemetry saved object as the notice was seen and dismissed
    //       this.hideTelemetryBanner && await this.hideTelemetryBanner();
    //       setScopedHistory(params.history);
    //       // Load application bundle
    //       const { renderApp } = await import('./application');
    //       // Get start services as specified in kibana.json
    //       const [coreStart, depsStart] = await core.getStartServices();
    //       setErrorOrchestrator(ErrorOrchestratorService);
    //       setHttp(core.http);
    //       setCookies(new Cookies());
    //       if (!AppState.checkCookies() || params.history.parentHistory.action === 'PUSH') {
    //         window.location.reload();
    //       }
    //       await this.initializeInnerAngular();
    //       params.element.classList.add('dscAppWrapper', 'wz-app');
    //       const unmount = await renderApp(innerAngularName, params.element);
    //       this.stateUpdater.next(() => {
    //         return {
    //           status: 0,
    //           category: {
    //             id: 'wazuh',
    //             label: 'Wazuh',
    //             order: 0,
    //             euiIconType: core.http.basePath.prepend(logosInitialState?.logos?.[SIDEBAR_LOGO] ? getAssetURL(logosInitialState?.logos?.[SIDEBAR_LOGO]) : getThemeAssetURL('icon.svg', UI_THEME)),
    //           }
    //         }
    //       })
    //       return () => {
    //         unmount();
    //         unregisterInterceptor();
    //       };
    //     } catch (error) {
    //       console.debug(error);
    //     }
    //   },
    //   category: {
    //     id: 'wazuh',
    //     label: 'Wazuh',
    //     order: 0,
    //     euiIconType: core.http.basePath.prepend(logosInitialState?.logos?.[SIDEBAR_LOGO] ? getAssetURL(logosInitialState?.logos?.[SIDEBAR_LOGO]) : getThemeAssetURL('icon.svg', UI_THEME)),
    //   },
    //   updater$: this.stateUpdater
    // });
    return {};
  }
  public start(core: CoreStart, plugins: AppPluginStartDependencies): WazuhStart {
    // hide security alert
    if (plugins.securityOss) {
      plugins.securityOss.insecureCluster.hideAlert(true);
    };
    if (plugins?.telemetry?.telemetryNotifications?.setOptedInNoticeSeen) {
      // assign to a method to hide the telemetry banner used when the app is mounted
      this.hideTelemetryBanner = () => plugins.telemetry.telemetryNotifications.setOptedInNoticeSeen();
    };
    // we need to register the application service at setup, but to render it
    // there are some start dependencies necessary, for this reason
    // initializeInnerAngular + initializeServices are assigned at start and used
    // when the application/embeddable is mounted
    this.initializeInnerAngular = async () => {
      if (this.innerAngularInitialized) {
        return;
      }
      // this is used by application mount and tests
      const { getInnerAngularModule } = await import('./get_inner_angular');
      const module = getInnerAngularModule(
        innerAngularName,
        core,
        plugins,
        this.initializerContext
      );
      setAngularModule(module);
      this.innerAngularInitialized = true;
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
    return {};
  }
}
