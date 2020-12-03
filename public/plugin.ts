import { AppMountParameters, CoreSetup, CoreStart, Plugin } from 'kibana/public';
import { setDataPlugin, setHttp, setToasts, setUiSettings } from './kibana-services';
import { loadAppConfig } from './react-services/load-app-config.service';
import {
  AppPluginStartDependencies,
  WazuhSetup,
  WazuhSetupDeps,
  WazuhStart,
  WazuhStartDeps,
} from './types';

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

  public start(core: CoreStart, plugins: AppPluginStartDependencies): WazuhStart {
    setToasts(core.notifications.toasts);
    setDataPlugin(plugins.data);
    setUiSettings(core.uiSettings);
    return {};
  }
}
