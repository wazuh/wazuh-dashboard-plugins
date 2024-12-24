import {
  AppMountParameters,
  CoreSetup,
  CoreStart,
  Plugin,
  PluginInitializerContext,
} from 'opensearch_dashboards/public';
import { Cookies } from 'react-cookie';
import { euiPaletteColorBlind } from '@elastic/eui';
import { createHashHistory } from 'history';
import {
  setDataPlugin,
  setHttp,
  setToasts,
  setUiSettings,
  setChrome,
  setNavigationPlugin,
  setVisualizationsPlugin,
  setSavedObjects,
  setOverlays,
  setScopedHistory,
  setCore,
  setPlugins,
  setCookies,
  setWzMainParams,
  setWzCurrentAppID,
  setWazuhCheckUpdatesPlugin,
  setHeaderActionMenuMounter,
  setWazuhCorePlugin,
  setWazuhEnginePlugin,
  setWazuhFleetPlugin,
} from './kibana-services';
import {
  AppPluginStartDependencies,
  WazuhSetup,
  WazuhSetupPlugins,
  WazuhStart,
  WazuhStartPlugins,
} from './types';
import { AppState } from './react-services/app-state';
import { setErrorOrchestrator } from './react-services/common-services';
import { ErrorOrchestratorService } from './react-services/error-orchestrator/error-orchestrator.service';
import {
  initializeInterceptor,
  unregisterInterceptor,
} from './services/request-handler';
import { Applications, Categories } from './utils/applications';
import NavigationService from './react-services/navigation-service';

export class WazuhPlugin
  implements
    Plugin<WazuhSetup, WazuhStart, WazuhSetupPlugins, WazuhStartPlugins>
{
  constructor(private readonly initializerContext: PluginInitializerContext) {}

  private hideTelemetryBanner?: () => void;

  public async setup(
    core: CoreSetup,
    plugins: WazuhSetupPlugins,
  ): Promise<WazuhSetup> {
    // Get custom logos configuration to start up the app with the correct logos

    // Redefine the mapKeys method to change the properties sent to euiPaletteColorBlind.
    // This is a workaround until the issue reported in Opensearch Dashboards is fixed.
    // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/5422
    // This should be reomved when the issue is fixed. Probably in OSD 2.12.0
    plugins.charts.colors.mappedColors.mapKeys = function (
      keys: (string | number)[],
    ) {
      const configMapping = this.getConfigColorMapping();
      const configColors = _.values(configMapping);
      let alreadyUsedColors: string[] = [];
      const keysToMap: (string | number)[] = [];

      _.each(keys, key => {
        // If this key is mapped in the config, it's unnecessary to have it mapped here
        if (configMapping[key as any]) {
          delete this._mapping[key];
          alreadyUsedColors.push(configMapping[key]);
        }

        // If this key is mapped to a color used by the config color mapping, we need to remap it
        if (_.includes(configColors, this._mapping[key])) {
          keysToMap.push(key);
        }

        // if key exist in oldMap, move it to mapping
        if (this._oldMap[key]) {
          this._mapping[key] = this._oldMap[key];
          alreadyUsedColors.push(this._mapping[key]);
        }

        // If this key isn't mapped, we need to map it
        if (this.get(key) === null) {
          keysToMap.push(key);
        }
      });

      alreadyUsedColors.push(...Object.values(this._mapping));
      alreadyUsedColors = alreadyUsedColors.map(color =>
        color.toLocaleLowerCase(),
      );

      // Choose colors from euiPaletteColorBlind and filter out any already assigned to keys
      const colorPalette = euiPaletteColorBlind({
        rotations: Math.ceil(
          (keysToMap.length + alreadyUsedColors.length) / 10,
        ),
        direction: core.uiSettings.get('theme:darkMode') ? 'darker' : 'lighter',
      })
        .filter(color => !alreadyUsedColors.includes(color.toLowerCase()))
        .slice(0, keysToMap.length);

      _.merge(this._mapping, _.zipObject(keysToMap, colorPalette));
    };

    // Register the applications
    for (const app of Applications) {
      const { category, id, title, redirectTo, order } = app;

      core.application.register({
        id,
        title,
        order,
        mount: async (params: AppMountParameters) => {
          try {
            setWzCurrentAppID(id);
            // Set the dynamic redirection
            setWzMainParams(redirectTo());
            initializeInterceptor(core);

            // hide the telemetry banner.
            // Set the flag in the telemetry saved object as the notice was seen and dismissed
            if (this.hideTelemetryBanner) {
              await this.hideTelemetryBanner();
            }

            setScopedHistory(params.history);
            // This allows you to add the selectors to the navbar
            setHeaderActionMenuMounter(params.setHeaderActionMenu);
            NavigationService.getInstance(createHashHistory());

            // Load application bundle
            const { renderApp } = await import('./application');

            setErrorOrchestrator(ErrorOrchestratorService);
            setHttp(core.http);
            setCookies(new Cookies());

            if (!AppState.checkCookies()) {
              NavigationService.getInstance().reload();
            }

            params.element.classList.add('dscAppWrapper', 'wz-app');

            const unmount = await renderApp(params);

            return () => {
              unmount();
              unregisterInterceptor();
            };
          } catch (error) {
            console.debug(error);
          }
        },
        category: Categories.find(
          ({ id: categoryID }) => categoryID === category,
        ),
      });
    }

    return {};
  }

  public start(
    core: CoreStart,
    plugins: AppPluginStartDependencies,
  ): WazuhStart {
    // hide security alert
    if (plugins.securityOss) {
      plugins.securityOss.insecureCluster.hideAlert(true);
    }

    if (plugins?.telemetry?.telemetryNotifications?.setOptedInNoticeSeen) {
      // assign to a method to hide the telemetry banner used when the app is mounted
      this.hideTelemetryBanner = () =>
        plugins.telemetry.telemetryNotifications.setOptedInNoticeSeen();
    }

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
    setWazuhCheckUpdatesPlugin(plugins.wazuhCheckUpdates);
    setWazuhCorePlugin(plugins.wazuhCore);
    setWazuhEnginePlugin(plugins.wazuhEngine);
    setWazuhFleetPlugin(plugins.wazuhFleet);

    return {};
  }
}
