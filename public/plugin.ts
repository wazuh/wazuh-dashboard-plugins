import { AppMountParameters, CoreSetup, CoreStart, Plugin } from 'kibana/public';
import { setDataPlugin, setHttp, setToasts } from './kibana-services';
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
      async mount(params: AppMountParameters) {
        // Load application bundle
        const { renderApp } = await import('./application');
        // Get start services as specified in kibana.json
        const [coreStart, depsStart] = await core.getStartServices();

        // Render the application
        return renderApp(coreStart, depsStart as AppPluginStartDependencies, params);
      },
    });
    return {};
  }

  public start(core: CoreStart, plugins: AppPluginStartDependencies): WazuhStart {
    setHttp(core.http);
    setToasts(core.notifications.toasts);
    setDataPlugin(plugins.data);

    loadAppConfig();

    return {};
  }
}
