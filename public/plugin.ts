import { AppMountParameters, CoreSetup, CoreStart, Plugin, PluginInitializerContext } from 'kibana/public';
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
  getUiSettings
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
  constructor(private readonly initializerContext: PluginInitializerContext) { }
  public initializeInnerAngular?: () => void;
  private innerAngularInitialized: boolean = false;

  public setup(core: CoreSetup, plugins: WazuhSetupPlugins): WazuhSetup {

    //custom styles
    const newCSS = document.createElement('link');
    newCSS.rel = 'stylesheet';
    newCSS.href = core.http.basePath.prepend(`/plugins/wazuh/assets/custom-style-base.css`);
    document.getElementsByTagName('head')[0].appendChild(newCSS);
    
    //custom script
    const newJS = document.createElement('script');
    newJS.src = core.http.basePath.prepend('/plugins/wazuh/assets/custom-style.js');
    document.getElementsByTagName('head')[0].appendChild(newJS);

    core.application.register({
      id: `wazuh`,
      title: 'Wazuh',
      icon: 'plugins/wazuh/assets/icon_blue.svg',
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
        if (!AppState.checkCookies() || params.history.parentHistory.action === 'PUSH') {
          window.location.reload();
        }

        await this.initializeInnerAngular();

        params.element.classList.add('dscAppWrapper');
        const unmount = await renderApp(innerAngularName, params.element);
        return () => {
          unmount();
        };
      },

    });
    return {};
  }

  public async start(core: CoreStart, plugins: AppPluginStartDependencies): Promise<WazuhStart> {
    // hide security alert
    if (plugins.securityOss) {
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


    //custom styles    
    const IS_DARK_THEME = getUiSettings().get('theme:darkMode');
    const mode = IS_DARK_THEME ? 'dark' : 'light';
    const newCSS = document.createElement('link');
    newCSS.rel = 'stylesheet';
    newCSS.href = core.http.basePath.prepend(`/plugins/wazuh/assets/custom-style-${mode}.css`);
    document.getElementsByTagName('head')[0].appendChild(newCSS);

    
    return {};
  }
}
