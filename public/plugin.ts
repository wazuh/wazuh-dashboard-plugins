import {
  AppMountParameters,
  CoreSetup,
  CoreStart,
  AppUpdater,
  Plugin,
  PluginInitializerContext
} from 'opensearch_dashboards/public';
import { BehaviorSubject } from 'rxjs';
import {
  AppPluginStartDependencies,
  WazuhSetup,
  WazuhSetupPlugins,
  WazuhStart,
  WazuhStartPlugins,
} from './types';

import {
  RegisterEmbeddable,
  EmbeddableFactories
} from './embeddables';

import AppsHandler from './apps/apps-handler';
import appMetrics from './apps/metrics';
import appWazuh from './apps/wazuh-app';
import { createMetricsDashboard } from './apps/metrics/views/dashboard/create-dashboard';


export class WazuhPlugin implements Plugin<WazuhSetup, WazuhStart, WazuhSetupPlugins, WazuhStartPlugins> {
  constructor(private readonly initializerContext: PluginInitializerContext) {
    this._appsHandler = new AppsHandler();
  }
  private _embeddableFactories:EmbeddableFactories = {};
  private _appsHandler;
  private _stateUpdater = new BehaviorSubject<AppUpdater>(() => ({}));

  public async setup(core: CoreSetup, plugins: WazuhSetupPlugins): WazuhSetup {

    this._appsHandler.setSetupCore(core);
    this._appsHandler.initUITheme();
    await this._appsHandler.initLogos();
    await this._appsHandler.setIsWazuhDisabled();

    this._embeddableFactories = RegisterEmbeddable(core, plugins);

    const apps = [
      appMetrics(),
      appWazuh(this._stateUpdater)
    ];
    this._appsHandler.registerApps(apps);

    return {};
  }
  public start(core: CoreStart, plugins: AppPluginStartDependencies): WazuhStart {

    this._appsHandler.startApps(core, plugins, this.initializerContext);

    return {
      factories: this._embeddableFactories as EmbeddableFactories,
      AppMetrics: createMetricsDashboard(core, plugins),
    };
  }
}
