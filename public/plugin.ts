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

const innerAngularName = 'app/wazuh';

export class WazuhPlugin implements Plugin<WazuhSetup, WazuhStart, WazuhSetupPlugins, WazuhStartPlugins> {
  constructor(private readonly initializerContext: PluginInitializerContext) {}
  public initializeInnerAngular?: () => void;
  private innerAngularInitialized: boolean = false;
  private stateUpdater = new BehaviorSubject<AppUpdater>(() => ({}));
  
  public setup(core: CoreSetup, plugins: WazuhSetupPlugins): WazuhSetup {
    core.application.register({
      id: `wazuh`,
      title: 'Wazuh',
      icon: core.http.basePath.prepend('/plugins/wazuh/assets/icon_blue.png'),
      mount: async (params: AppMountParameters) => {
        if (!this.initializeInnerAngular) {
          throw Error('Wazuh plugin method initializeInnerAngular is undefined');
        }
        setScopedHistory(params.history);
        // Load application bundle
        const { renderApp } = await import('./application');
        // Get start services as specified in kibana.json
        const [coreStart, depsStart] = await core.getStartServices();
        setHttp(core.http);
        setCookies(new Cookies());
        if(!AppState.checkCookies() || params.history.parentHistory.action === 'PUSH') {
          window.location.reload();
        }

        await this.initializeInnerAngular();

        //Check is user has Wazuh disabled
        const response = await core.http.get(`/api/check-wazuh`);

        params.element.classList.add('dscAppWrapper');
        const unmount = await renderApp(innerAngularName, params.element);

        //Update if user has Wazuh disabled
        this.stateUpdater.next(() => {
          if(response.isWazuhDisabled) unmount();
          return { status: response.isWazuhDisabled }
        })
        return () => {
          unmount();
        };
      },
      category: {
        id: 'wazuh',
        label: 'Wazuh',
        order: 0,
        euiIconType: core.http.basePath.prepend('/plugins/wazuh/assets/icon_blue.png'),      
      },
      updater$: this.stateUpdater
    });
    return {};
  }

  public async start(core: CoreStart, plugins: AppPluginStartDependencies): Promise<WazuhStart> {
    // hide security alert
    if(plugins.securityOss) {
      plugins.securityOss.insecureCluster.hideAlert(true);
    }

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
    return {};
  }
}
