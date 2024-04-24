import {
  AppMountParameters,
  CoreSetup,
  CoreStart,
  Plugin,
  PluginInitializerContext,
} from 'opensearch_dashboards/public';
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
  setWzMainParams,
  setWzCurrentAppID,
  setWazuhCheckUpdatesPlugin,
  setHeaderActionMenuMounter,
  setWazuhCorePlugin,
} from './kibana-services';
import { validate as validateNodeCronInterval } from 'node-cron';
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
import {
  initializeInterceptor,
  unregisterInterceptor,
} from './services/request-handler';
import { Applications, Categories } from './utils/applications';
import { syncHistoryLocations } from './kibana-integrations/discover/kibana_services';
import { euiPaletteColorBlind } from '@elastic/eui';

const innerAngularName = 'app/wazuh';

export class WazuhPlugin
  implements
    Plugin<WazuhSetup, WazuhStart, WazuhSetupPlugins, WazuhStartPlugins>
{
  constructor(private readonly initializerContext: PluginInitializerContext) {}
  public initializeInnerAngular?: () => void;
  private innerAngularInitialized: boolean = false;
  private hideTelemetryBanner?: () => void;
  public async setup(
    core: CoreSetup,
    plugins: WazuhSetupPlugins,
  ): Promise<WazuhSetup> {
    // Hide the discover deprecation notice
    // After opensearch version 2.11.0 this line may be deleted
    localStorage.setItem('discover:deprecation-notice:show', 'false');

    // Get custom logos configuration to start up the app with the correct logos
    let logosInitialState = {};
    try {
      logosInitialState = await core.http.get(`/api/logos`);
    } catch (error) {
      console.error('plugin.ts: Error getting logos configuration', error);
    }

    // Redefine the mapKeys method to change the properties sent to euiPaletteColorBlind.
    // This is a workaround until the issue reported in Opensearch Dashboards is fixed.
    // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/5422
    // This should be reomved when the issue is fixed. Probably in OSD 2.12.0
    plugins.charts.colors.mappedColors.mapKeys = function (
      keys: Array<string | number>,
    ) {
      const configMapping = this.getConfigColorMapping();
      const configColors = _.values(configMapping);
      const oldColors = _.values(this._oldMap);

      let alreadyUsedColors: string[] = [];
      const keysToMap: Array<string | number> = [];
      _.each(keys, key => {
        // If this key is mapped in the config, it's unnecessary to have it mapped here
        if (configMapping[key as any]) {
          delete this._mapping[key];
          alreadyUsedColors.push(configMapping[key]);
        }

        // If this key is mapped to a color used by the config color mapping, we need to remap it
        if (_.includes(configColors, this._mapping[key])) keysToMap.push(key);

        // if key exist in oldMap, move it to mapping
        if (this._oldMap[key]) {
          this._mapping[key] = this._oldMap[key];
          alreadyUsedColors.push(this._mapping[key]);
        }

        // If this key isn't mapped, we need to map it
        if (this.get(key) == null) keysToMap.push(key);
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
    Applications.forEach(app => {
      const { category, id, title, redirectTo, order } = app;
      core.application.register({
        id,
        title,
        order,
        mount: async (params: AppMountParameters) => {
          try {
            /* Workaround: Redefine the validation functions of cron.statistics.interval setting.
            There is an optimization error of the frontend side source code due to some modules can
            not be loaded
            */
            const setting = plugins.wazuhCore.configuration._settings.get(
              'cron.statistics.interval',
            );
            !setting.validateUIForm &&
              (setting.validateUIForm = function (value) {
                return this.validate(value);
              });
            !setting.validate &&
              (setting.validate = function (value: string) {
                return validateNodeCronInterval(value)
                  ? undefined
                  : 'Interval is not valid.';
              });
            setWzCurrentAppID(id);
            // Set the dynamic redirection
            setWzMainParams(redirectTo());
            initializeInterceptor(core);
            if (!this.initializeInnerAngular) {
              throw Error(
                'Wazuh plugin method initializeInnerAngular is undefined',
              );
            }

            // Update redux app state logos with the custom logos
            if (logosInitialState?.logos) {
              store.dispatch(updateAppConfig(logosInitialState.logos));
            }
            // hide the telemetry banner.
            // Set the flag in the telemetry saved object as the notice was seen and dismissed
            this.hideTelemetryBanner && (await this.hideTelemetryBanner());
            setScopedHistory(params.history);
            // This allows you to add the selectors to the navbar
            setHeaderActionMenuMounter(params.setHeaderActionMenu);
            // Discover currently uses two history instances:
            // one from Kibana Platform and another from history package.
            // Below function is used every time Discover app is loaded to synchronize both instances
            syncHistoryLocations();
            // Load application bundle
            const { renderApp } = await import('./application');
            // Get start services as specified in kibana.json
            const [coreStart, depsStart] = await core.getStartServices();
            setErrorOrchestrator(ErrorOrchestratorService);
            setHttp(core.http);
            setCookies(new Cookies());
            if (!AppState.checkCookies()) {
              window.location.reload();
            }
            await this.initializeInnerAngular();
            params.element.classList.add('dscAppWrapper', 'wz-app');
            const unmount = await renderApp(innerAngularName, params.element);
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
    });
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
        this.initializerContext,
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
    setWazuhCheckUpdatesPlugin(plugins.wazuhCheckUpdates);
    setWazuhCorePlugin(plugins.wazuhCore);
    return {};
  }
}
