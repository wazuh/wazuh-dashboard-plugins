import { BehaviorSubject } from 'rxjs';
import { AppMountParameters, CoreSetup, CoreStart, AppUpdater, Plugin, PluginInitializerContext } from 'kibana/public';
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
import { getThemeAssetURL, getAssetURL } from './utils/assets';
import { WzRequest } from './react-services/wz-request';
const innerAngularName = 'app/wazuh';
export class WazuhPlugin implements Plugin<WazuhSetup, WazuhStart, WazuhSetupPlugins, WazuhStartPlugins> {
  constructor(private readonly initializerContext: PluginInitializerContext) {}
  public initializeInnerAngular?: () => void;
  private innerAngularInitialized: boolean = false;
  private stateUpdater = new BehaviorSubject<AppUpdater>(() => ({}));
  private hideTelemetryBanner?: () => void;
  public setup(core: CoreSetup, plugins: WazuhSetupPlugins): WazuhSetup {
    const UI_THEME = core.uiSettings.get('theme:darkMode') ? 'dark' : 'light';
    core.application.register({
      id: `wazuh`,
      title: 'Wazuh',
      icon: core.http.basePath.prepend(getThemeAssetURL('icon.svg', UI_THEME)),
      mount: async (params: AppMountParameters) => {
        try {
          if (!this.initializeInnerAngular) {
            throw Error('Wazuh plugin method initializeInnerAngular is undefined');
          }
          // hide the telemetry banner.
          // Set the flag in the telemetry saved object as the notice was seen and dismissed
          this.hideTelemetryBanner && await this.hideTelemetryBanner();
          setScopedHistory(params.history);
          // Load application bundle
          const { renderApp } = await import('./application');
          // Get start services as specified in kibana.json
          const [coreStart, depsStart] = await core.getStartServices();
          setErrorOrchestrator(ErrorOrchestratorService);
          setHttp(core.http);
          setCookies(new Cookies());
          if(!AppState.checkCookies() || params.history.parentHistory.action === 'PUSH') {
            window.location.reload();
          }
          await this.initializeInnerAngular();
          //Check is user has Wazuh disabled
          const response = await WzRequest.genericReq(
            'GET',
            `/api/check-wazuh`,
          )
          
          params.element.classList.add('dscAppWrapper', 'wz-app');
          const unmount = await renderApp(innerAngularName, params.element);
          //Update if user has Wazuh disabled
          this.stateUpdater.next(() => {
            if (response.data.isWazuhDisabled) {
              unmount();
            }
            return {
              status: response.data.isWazuhDisabled,
              category: {
                id: 'wazuh',
                label: 'Wazuh',
                order: 0,
                euiIconType: core.http.basePath.prepend(response.data.logoSidebar ? getAssetURL(response.data.logoSidebar) : getThemeAssetURL('icon.svg', UI_THEME)),
              }}
          })
          return () => {
            unmount();
          };
        }catch(error){
          console.debug(error);
        }
      },
      category: {
        id: 'wazuh',
        label: 'Wazuh',
        order: 0,
        euiIconType: core.http.basePath.prepend(getThemeAssetURL('icon.svg', UI_THEME)),
      },
      updater$: this.stateUpdater
    });
    return {};
  }
  public start(core: CoreStart, plugins: AppPluginStartDependencies): WazuhStart {
    // hide security alert
    if(plugins.securityOss) {
      plugins.securityOss.insecureCluster.hideAlert(true);
    };
    if(plugins?.telemetry?.telemetryNotifications?.setOptedInNoticeSeen) {
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