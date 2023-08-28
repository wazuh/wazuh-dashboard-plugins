import { BehaviorSubject } from 'rxjs';
import {
  AppMountParameters,
  CoreSetup,
  CoreStart,
  AppUpdater,
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
import store from './redux/store';
import { updateAppConfig } from './redux/actions/appConfigActions';
import {
  initializeInterceptor,
  unregisterInterceptor,
} from './services/request-handler';
import { DEFAULT_APP_CATEGORIES } from '../../../src/core/public';

const SIDEBAR_LOGO = 'customization.logo.sidebar';
const innerAngularName = 'app/wazuh';

export class WazuhPlugin
  implements
    Plugin<WazuhSetup, WazuhStart, WazuhSetupPlugins, WazuhStartPlugins>
{
  constructor(private readonly initializerContext: PluginInitializerContext) {}
  public initializeInnerAngular?: () => void;
  private innerAngularInitialized: boolean = false;
  private appStateUpdater = new BehaviorSubject<AppUpdater>(() => ({}));
  private stateUpdater = new BehaviorSubject<AppUpdater>(() => ({}));
  private hideTelemetryBanner?: () => void;
  public async setup(core: CoreSetup, plugins: WazuhSetupPlugins): WazuhSetup {
    const UI_THEME = core.uiSettings.get('theme:darkMode') ? 'dark' : 'light';

    // Get custom logos configuration to start up the app with the correct logos
    let logosInitialState = {};
    try {
      logosInitialState = await core.http.get(`/api/logos`);
    } catch (error) {
      console.error('plugin.ts: Error getting logos configuration', error);
    }

    //Check if user has wazuh disabled and avoid registering the application if not
    let response = { isWazuhDisabled: 1 };
    try {
      response = await core.http.get('/api/check-wazuh');
    } catch (error) {
      console.error('plugin.ts: Error checking if Wazuh is enabled', error);
    }

    if (!response.isWazuhDisabled) {
      core.application.register({
        id: `wazuh`,
        title: 'Wazuh',
        icon: core.http.basePath.prepend(
          logosInitialState?.logos?.[SIDEBAR_LOGO]
            ? getAssetURL(logosInitialState?.logos?.[SIDEBAR_LOGO])
            : getThemeAssetURL('icon.svg', UI_THEME),
        ),
        mount: async (params: AppMountParameters) => {
          try {
            setWzMainParams('/overview/');
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
            // Load application bundle
            const { renderApp } = await import('./application');
            // Get start services as specified in kibana.json
            const [coreStart, depsStart] = await core.getStartServices();
            setErrorOrchestrator(ErrorOrchestratorService);
            setHttp(core.http);
            setCookies(new Cookies());
            if (
              !AppState.checkCookies() ||
              params.history.parentHistory.action === 'PUSH'
            ) {
              window.location.reload();
            }
            await this.initializeInnerAngular();
            params.element.classList.add('dscAppWrapper', 'wz-app');
            const unmount = await renderApp(innerAngularName, params.element);
            this.stateUpdater.next(() => {
              return {
                status: response.isWazuhDisabled,
                category: {
                  id: 'wazuh',
                  label: 'Wazuh',
                  order: 0,
                  euiIconType: core.http.basePath.prepend(
                    logosInitialState?.logos?.[SIDEBAR_LOGO]
                      ? getAssetURL(logosInitialState?.logos?.[SIDEBAR_LOGO])
                      : getThemeAssetURL('icon.svg', UI_THEME),
                  ),
                },
              };
            });
            return () => {
              unmount();
              unregisterInterceptor();
            };
          } catch (error) {
            console.debug(error);
          }
        },
        category: {
          id: 'wazuh',
          label: 'Wazuh',
          order: 0,
          euiIconType: core.http.basePath.prepend(
            logosInitialState?.logos?.[SIDEBAR_LOGO]
              ? getAssetURL(logosInitialState?.logos?.[SIDEBAR_LOGO])
              : getThemeAssetURL('icon.svg', UI_THEME),
          ),
        },
        updater$: this.stateUpdater,
      });

      // Define the app categories
      const categoryEndpointSecurity = {
        id: 'wz-category-endpoint-security',
        label: 'Endpoint security',
        order: 1,
        euiIconType: core.http.basePath.prepend(
          logosInitialState?.logos?.[SIDEBAR_LOGO]
            ? getAssetURL(logosInitialState?.logos?.[SIDEBAR_LOGO])
            : getThemeAssetURL('icon.svg', UI_THEME),
        ),
      };

      const categoryThreadIntelligence = {
        id: 'wz-category-thread-intelligence',
        label: 'Thread intelligence',
        order: 2,
        euiIconType: core.http.basePath.prepend(
          logosInitialState?.logos?.[SIDEBAR_LOGO]
            ? getAssetURL(logosInitialState?.logos?.[SIDEBAR_LOGO])
            : getThemeAssetURL('icon.svg', UI_THEME),
        ),
      };

      const categorySecurityOperations = {
        id: 'wz-category-security-operations',
        label: 'Security operations',
        order: 3,
        euiIconType: core.http.basePath.prepend(
          logosInitialState?.logos?.[SIDEBAR_LOGO]
            ? getAssetURL(logosInitialState?.logos?.[SIDEBAR_LOGO])
            : getThemeAssetURL('icon.svg', UI_THEME),
        ),
      };

      const categoryCloudSecurity = {
        id: 'wz-category-cloud-security',
        label: 'Cloud security',
        order: 4,
        euiIconType: core.http.basePath.prepend(
          logosInitialState?.logos?.[SIDEBAR_LOGO]
            ? getAssetURL(logosInitialState?.logos?.[SIDEBAR_LOGO])
            : getThemeAssetURL('icon.svg', UI_THEME),
        ),
      };

      const categoryServerManagement = {
        id: 'wz-category-server-management',
        label: 'Server management',
        order: 5,
        euiIconType: core.http.basePath.prepend(
          logosInitialState?.logos?.[SIDEBAR_LOGO]
            ? getAssetURL(logosInitialState?.logos?.[SIDEBAR_LOGO])
            : getThemeAssetURL('icon.svg', UI_THEME),
        ),
      };

      // Register the applications
      [
        {
          category: categoryEndpointSecurity,
          id: 'wz-home',
          title: 'Overview',
          redirectTo: () => '/overview/',
        },
        {
          category: categoryEndpointSecurity,
          id: 'wz-endpoints-summary',
          title: 'Endpoints summary',
          redirectTo: () => '/agents-preview/',
        },
        {
          category: categoryEndpointSecurity,
          id: 'wz-integrity-monitoring',
          title: 'Integrity monitoring',
          redirectTo: () =>
            `/overview/?tab=fim&tabView=panels${
              store.getState()?.appStateReducers?.currentAgentData?.id
                ? `&agentId=${
                    store.getState()?.appStateReducers?.currentAgentData?.id
                  }`
                : ''
            }`,
        },
        {
          category: categoryEndpointSecurity,
          id: 'wz-policy-monitoring',
          title: 'Policy monitoring',
          redirectTo: () =>
            `/overview/?tab=pm&tabView=panels${
              store.getState()?.appStateReducers?.currentAgentData?.id
                ? `&agentId=${
                    store.getState()?.appStateReducers?.currentAgentData?.id
                  }`
                : ''
            }`,
        },
        {
          category: categoryEndpointSecurity,
          id: 'wz-security-configuration-assessment',
          title: 'Security configuration assessment',
          redirectTo: () =>
            `/overview/?tab=sca&tabView=panels${
              store.getState()?.appStateReducers?.currentAgentData?.id
                ? `&agentId=${
                    store.getState()?.appStateReducers?.currentAgentData?.id
                  }`
                : ''
            }`,
        },
        {
          category: categoryEndpointSecurity,
          id: 'wz-system-auditing',
          title: 'System auditing',
          redirectTo: () =>
            `/overview/?tab=audit&tabView=panels${
              store.getState()?.appStateReducers?.currentAgentData?.id
                ? `&agentId=${
                    store.getState()?.appStateReducers?.currentAgentData?.id
                  }`
                : ''
            }`,
        },
        {
          category: categoryEndpointSecurity,
          id: 'wz-openscap',
          title: 'OpenSCAP',
          redirectTo: () =>
            `/overview/?tab=oscap&tabView=panels${
              store.getState()?.appStateReducers?.currentAgentData?.id
                ? `&agentId=${
                    store.getState()?.appStateReducers?.currentAgentData?.id
                  }`
                : ''
            }`,
        },
        {
          category: categoryEndpointSecurity,
          id: 'wz-ciscat',
          title: 'CIS-CAT',
          redirectTo: () =>
            `/overview/?tab=ciscat&tabView=panels${
              store.getState()?.appStateReducers?.currentAgentData?.id
                ? `&agentId=${
                    store.getState()?.appStateReducers?.currentAgentData?.id
                  }`
                : ''
            }`,
        },
        {
          category: categoryThreadIntelligence,
          id: 'wz-security-events',
          title: 'Security events',
          redirectTo: () =>
            `/overview/?tab=general&tabView=panels${
              store.getState()?.appStateReducers?.currentAgentData?.id
                ? `&agentId=${
                    store.getState()?.appStateReducers?.currentAgentData?.id
                  }`
                : ''
            }`,
        },
        {
          category: categoryThreadIntelligence,
          id: 'wz-vulnerabilities',
          title: 'Vulnerabilities',
          redirectTo: () =>
            `/overview/?tab=vuls&tabView=panels${
              store.getState()?.appStateReducers?.currentAgentData?.id
                ? `&agentId=${
                    store.getState()?.appStateReducers?.currentAgentData?.id
                  }`
                : ''
            }`,
        },
        {
          category: categoryThreadIntelligence,
          id: 'wz-mitre-attack',
          title: 'MITRE ATT&CK',
          redirectTo: () =>
            `/overview/?tab=mitre&tabView=panels${
              store.getState()?.appStateReducers?.currentAgentData?.id
                ? `&agentId=${
                    store.getState()?.appStateReducers?.currentAgentData?.id
                  }`
                : ''
            }`,
        },
        {
          category: categoryThreadIntelligence,
          id: 'wz-virustotal',
          title: 'Virustotal',
          redirectTo: () =>
            `/overview/?tab=virustotal&tabView=panels${
              store.getState()?.appStateReducers?.currentAgentData?.id
                ? `&agentId=${
                    store.getState()?.appStateReducers?.currentAgentData?.id
                  }`
                : ''
            }`,
        },
        {
          category: categorySecurityOperations,
          id: 'wz-pci-dss',
          title: 'PCI DSS',
          redirectTo: () =>
            `/overview/?tab=pci&tabView=panels${
              store.getState()?.appStateReducers?.currentAgentData?.id
                ? `&agentId=${
                    store.getState()?.appStateReducers?.currentAgentData?.id
                  }`
                : ''
            }`,
        },
        {
          category: categorySecurityOperations,
          id: 'wz-hipaa',
          title: 'HIPAA',
          redirectTo: () =>
            `/overview/?tab=hipaa&tabView=panels${
              store.getState()?.appStateReducers?.currentAgentData?.id
                ? `&agentId=${
                    store.getState()?.appStateReducers?.currentAgentData?.id
                  }`
                : ''
            }`,
        },
        {
          category: categorySecurityOperations,
          id: 'wz-gdpr',
          title: 'GDPR',
          redirectTo: () =>
            `/overview/?tab=gdpr&tabView=panels${
              store.getState()?.appStateReducers?.currentAgentData?.id
                ? `&agentId=${
                    store.getState()?.appStateReducers?.currentAgentData?.id
                  }`
                : ''
            }`,
        },
        {
          category: categorySecurityOperations,
          id: 'wz-nist-800-53',
          title: 'NIST 800-53',
          redirectTo: () =>
            `/overview/?tab=nist&tabView=panels${
              store.getState()?.appStateReducers?.currentAgentData?.id
                ? `&agentId=${
                    store.getState()?.appStateReducers?.currentAgentData?.id
                  }`
                : ''
            }`,
        },
        {
          category: categorySecurityOperations,
          id: 'wz-tsc',
          title: 'TSC',
          redirectTo: () =>
            `/overview/?tab=tsc&tabView=panels${
              store.getState()?.appStateReducers?.currentAgentData?.id
                ? `&agentId=${
                    store.getState()?.appStateReducers?.currentAgentData?.id
                  }`
                : ''
            }`,
        },
        {
          category: categorySecurityOperations,
          id: 'wz-it-hygiene',
          title: 'IT Hygiene',
          // TODO: redirection
          redirectTo: () =>
            `/agents/?tab=welcome${
              store.getState()?.appStateReducers?.currentAgentData?.id
                ? `&agent=${
                    store.getState()?.appStateReducers?.currentAgentData?.id
                  }`
                : ''
            }`,
        },
        {
          category: categorySecurityOperations,
          id: 'wz-osquery',
          title: 'Osquery',
          // TODO: redirection
          redirectTo: () =>
            `/overview/?tab=osquery&tabView=panels${
              store.getState()?.appStateReducers?.currentAgentData?.id
                ? `&agentId=${
                    store.getState()?.appStateReducers?.currentAgentData?.id
                  }`
                : ''
            }`,
        },
        {
          category: categoryCloudSecurity,
          id: 'wz-amazon-web-services',
          title: 'Amazon Web Services',
          redirectTo: () =>
            `/overview/?tab=aws&tabView=panels${
              store.getState()?.appStateReducers?.currentAgentData?.id
                ? `&agentId=${
                    store.getState()?.appStateReducers?.currentAgentData?.id
                  }`
                : ''
            }`,
        },
        {
          category: categoryCloudSecurity,
          id: 'wz-google-cloud',
          title: 'Google Cloud',
          redirectTo: () =>
            `/overview/?tab=gcp&tabView=panels${
              store.getState()?.appStateReducers?.currentAgentData?.id
                ? `&agentId=${
                    store.getState()?.appStateReducers?.currentAgentData?.id
                  }`
                : ''
            }`,
        },
        {
          category: categoryCloudSecurity,
          id: 'wz-github',
          title: 'GitHub',
          redirectTo: () =>
            `/overview/?tab=github&tabView=panels${
              store.getState()?.appStateReducers?.currentAgentData?.id
                ? `&agentId=${
                    store.getState()?.appStateReducers?.currentAgentData?.id
                  }`
                : ''
            }`,
        },
        {
          category: categoryCloudSecurity,
          id: 'wz-office365',
          title: 'Office 365',
          redirectTo: () =>
            `/overview/?tab=office&tabView=panels${
              store.getState()?.appStateReducers?.currentAgentData?.id
                ? `&agentId=${
                    store.getState()?.appStateReducers?.currentAgentData?.id
                  }`
                : ''
            }`,
        },
        {
          category: categoryCloudSecurity,
          id: 'wz-docker',
          title: 'Docker',
          redirectTo: () =>
            `/overview/?tab=docker&tabView=panels${
              store.getState()?.appStateReducers?.currentAgentData?.id
                ? `&agentId=${
                    store.getState()?.appStateReducers?.currentAgentData?.id
                  }`
                : ''
            }`,
        },
        {
          category: categoryServerManagement,
          id: 'wz-rules',
          title: 'Rules',
          redirectTo: () => '/manager/?tab=ruleset',
        },
        {
          category: categoryServerManagement,
          id: 'wz-decoders',
          title: 'Decoders',
          redirectTo: () => '/manager/?tab=decoders',
        },
        {
          category: categoryServerManagement,
          id: 'wz-cdb-lists',
          title: 'CDB Lists',
          redirectTo: () => '/manager/?tab=lists',
        },
        {
          category: categoryServerManagement,
          id: 'wz-groups',
          title: 'Groups',
          redirectTo: () => '/manager/?tab=groups',
        },
        {
          category: categoryServerManagement,
          id: 'wz-status',
          title: 'Status',
          redirectTo: () => '/manager/?tab=status',
        },
        {
          category: categoryServerManagement,
          id: 'wz-cluster',
          title: 'Cluster',
          redirectTo: () => '/manager/?tab=monitoring',
        },
        {
          category: categoryServerManagement,
          id: 'wz-statistics',
          title: 'Statistics',
          redirectTo: () => '/manager/?tab=statistics',
        },
        {
          category: categoryServerManagement,
          id: 'wz-logs',
          title: 'Logs',
          redirectTo: () => '/manager/?tab=logs',
        },
        {
          category: categoryServerManagement,
          id: 'wz-reporting',
          title: 'Reporting',
          redirectTo: () => '/manager/?tab=reporting',
        },
        {
          category: categoryServerManagement,
          id: 'wz-settings',
          title: 'Settings',
          redirectTo: () => '/manager/?tab=configuration',
        },
        {
          category: categoryServerManagement,
          id: 'wz-api-console',
          title: 'API console',
          redirectTo: () => '/wazuh-dev/?tab=devTools',
        },
        {
          category: categoryServerManagement,
          id: 'wz-ruleset-test',
          title: 'Ruleset test',
          redirectTo: () => '/wazuh-dev/?tab=logtest',
        },
        {
          category: categoryServerManagement,
          id: 'wz-rbac',
          title: 'RBAC',
          redirectTo: () => '/security/?tab=users',
        },
        {
          category: DEFAULT_APP_CATEGORIES.management,
          id: 'wz-server-api',
          title: 'Server API',
          redirectTo: () => '/settings?tab=api',
        },
        {
          category: DEFAULT_APP_CATEGORIES.management,
          id: 'wz-modules',
          title: 'Modules',
          redirectTo: () => '/settings?tab=modules',
        },
        {
          category: DEFAULT_APP_CATEGORIES.management,
          id: 'wz-server-data',
          title: 'Server data',
          redirectTo: () => '/settings?tab=sample_data',
        },
        {
          category: DEFAULT_APP_CATEGORIES.management,
          id: 'wz-configuration',
          title: 'Configuration',
          redirectTo: () => '/settings?tab=configuration',
        },
        {
          category: DEFAULT_APP_CATEGORIES.management,
          id: 'wz-miscellaneous',
          title: 'Miscellaneous',
          redirectTo: () => '/settings?tab=miscellaneous',
        },
        {
          category: DEFAULT_APP_CATEGORIES.management,
          id: 'wz-app-logs',
          title: 'Logs',
          redirectTo: () => '/settings?tab=logs',
        },
        {
          category: DEFAULT_APP_CATEGORIES.management,
          id: 'wz-about',
          title: 'About',
          redirectTo: () => '/settings?tab=about',
        },
      ].forEach(({ category, id, title, redirectTo }) => {
        core.application.register({
          id,
          title,
          mount: async (params: AppMountParameters) => {
            try {
              // Set the dynamic redirection
              setWzMainParams(redirectTo());
              setWzCurrentAppID(id);
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
              // Load application bundle
              const { renderApp } = await import('./application');
              // Get start services as specified in kibana.json
              const [coreStart, depsStart] = await core.getStartServices();
              setErrorOrchestrator(ErrorOrchestratorService);
              setHttp(core.http);
              setCookies(new Cookies());
              if (
                !AppState.checkCookies() ||
                params.history.parentHistory.action === 'PUSH'
              ) {
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
          category,
        });
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
    return {};
  }
}
