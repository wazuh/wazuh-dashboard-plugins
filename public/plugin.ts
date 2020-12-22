import { AppMountParameters, CoreSetup, CoreStart, Plugin } from 'kibana/public';
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
} from './kibana-services';
import { resolveApis } from './react-services/api-resolver.service';
import { loadAppConfig } from './react-services/load-app-config.service';
import { checkCurrentSecurityPlatform } from './react-services/security-utils';
import WzAuthentication from './react-services/wz-authentication';
import { updateCurrentPlatform } from './redux/actions/appStateActions';
import store from './redux/store';
import {
  AppPluginStartDependencies,
  WazuhSetup,
  WazuhSetupDeps,
  WazuhStart,
  WazuhStartDeps,
} from './types';
import { checkPluginVersion, changeWazuhNavLogo } from './utils';

export class WazuhPlugin implements Plugin<WazuhSetup, WazuhStart, WazuhSetupDeps, WazuhStartDeps> {
  public setup(core: CoreSetup, plugins: WazuhSetupDeps): WazuhSetup {
    core.application.register({
      id: `wazuh`,
      title: 'Wazuh',
      icon: 'plugins/wazuh/assets/icon_blue.png',
      async mount(params: AppMountParameters) {
        // Load application bundle
        const { renderApp } = await import('./application');
        // Get start services as specified in kibana.json
        const [coreStart, depsStart] = await core.getStartServices();

        setHttp(core.http);
        loadAppConfig();

        // Render the application
        return renderApp(coreStart, depsStart as AppPluginStartDependencies, params);
      },
    });
    return {};
  }

  public async start(core: CoreStart, plugins: AppPluginStartDependencies): WazuhStart {
    setHttp(core.http);
    setToasts(core.notifications.toasts);
    setDataPlugin(plugins.data);
    setUiSettings(core.uiSettings);
    setChrome(core.chrome);
    setNavigationPlugin(plugins.navigation);
    setVisualizationsPlugin(plugins.visualizations);
    setSavedObjects(core.savedObjects);
    setOverlays(core.overlays);

    changeWazuhNavLogo();

    // Set default api
    await resolveApis();

    // Set currentSecurity platform in Redux when app starts.
    checkCurrentSecurityPlatform().then((item) => {
      store.dispatch(updateCurrentPlatform(item))
    }).catch(() => {})
    
    // Init the process of refreshing the user's token when app start.
    checkPluginVersion().finally(WzAuthentication.refresh);
    return {};
  }
}
