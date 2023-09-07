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
import { i18n } from '@osd/i18n';
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
        label: i18n.translate('wz-app-category-endpoint-security', {
          defaultMessage: 'Endpoint security',
        }),
        order: 1,
        euiIconType: core.http.basePath.prepend(
          logosInitialState?.logos?.[SIDEBAR_LOGO]
            ? getAssetURL(logosInitialState?.logos?.[SIDEBAR_LOGO])
            : getThemeAssetURL('icon.svg', UI_THEME),
        ),
      };

      const categoryThreadIntelligence = {
        id: 'wz-category-thread-intelligence',
        label: i18n.translate('wz-app-category-thread-intelligence', {
          defaultMessage: 'Thread intelligence',
        }),
        order: 2,
        euiIconType: core.http.basePath.prepend(
          logosInitialState?.logos?.[SIDEBAR_LOGO]
            ? getAssetURL(logosInitialState?.logos?.[SIDEBAR_LOGO])
            : getThemeAssetURL('icon.svg', UI_THEME),
        ),
      };

      const categorySecurityOperations = {
        id: 'wz-category-security-operations',
        label: i18n.translate('wz-app-category-security-operations', {
          defaultMessage: 'Security operations',
        }),
        order: 3,
        euiIconType: core.http.basePath.prepend(
          logosInitialState?.logos?.[SIDEBAR_LOGO]
            ? getAssetURL(logosInitialState?.logos?.[SIDEBAR_LOGO])
            : getThemeAssetURL('icon.svg', UI_THEME),
        ),
      };

      const categoryCloudSecurity = {
        id: 'wz-category-cloud-security',
        label: i18n.translate('wz-app-category-cloud-security', {
          defaultMessage: 'Cloud security',
        }),
        order: 4,
        euiIconType: core.http.basePath.prepend(
          logosInitialState?.logos?.[SIDEBAR_LOGO]
            ? getAssetURL(logosInitialState?.logos?.[SIDEBAR_LOGO])
            : getThemeAssetURL('icon.svg', UI_THEME),
        ),
      };

      const categoryServerManagement = {
        id: 'wz-category-server-management',
        label: i18n.translate('wz-app-category-server-management', {
          defaultMessage: 'Server management',
        }),
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
          title: i18n.translate('wz-app-home', {
            defaultMessage: 'Overview',
          }),
          redirectTo: () => '/overview/',
        },
        {
          category: categoryEndpointSecurity,
          id: 'endpoints-summary',
          title: i18n.translate('wz-app-endpoints-summary', {
            defaultMessage: 'Endpoints summary',
          }),
          redirectTo: () => '/agents-preview/',
        },
        {
          category: categoryEndpointSecurity,
          id: 'integrity-monitoring',
          title: i18n.translate('wz-app-integrity-monitoring', {
            defaultMessage: 'Integrity monitoring',
          }),
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
          id: 'policy-monitoring',
          title: i18n.translate('wz-app-policy-monitoring', {
            defaultMessage: 'Policy monitoring',
          }),
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
          id: 'security-configuration-assessment',
          title: i18n.translate('wz-app-security-configuration-assessment', {
            defaultMessage: 'Security configuration assessment',
          }),
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
          id: 'system-auditing',
          title: i18n.translate('wz-app-system-auditing', {
            defaultMessage: 'System auditing',
          }),
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
          id: 'openscap',
          title: i18n.translate('wz-app-openscap', {
            defaultMessage: 'OpenSCAP',
          }),
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
          id: 'ciscat',
          title: i18n.translate('wz-app-ciscat', {
            defaultMessage: 'CIS-CAT',
          }),
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
          id: 'security-events',
          title: i18n.translate('wz-app-security-events', {
            defaultMessage: 'Security events',
          }),
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
          id: 'vulnerabilities',
          title: i18n.translate('wz-app-vulnerabilities', {
            defaultMessage: 'Vulnerabilities',
          }),
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
          id: 'mitre-attack',
          title: i18n.translate('wz-app-mitre-attack', {
            defaultMessage: 'MITRE ATT&CK',
          }),
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
          id: 'virustotal',
          title: i18n.translate('wz-app-virustotal', {
            defaultMessage: 'Virustotal',
          }),
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
          id: 'pci-dss',
          title: i18n.translate('wz-app-pci-dss', {
            defaultMessage: 'PCI DSS',
          }),
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
          id: 'hipaa',
          title: i18n.translate('wz-app-hipaa', {
            defaultMessage: 'HIPAA',
          }),
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
          id: 'gdpr',
          title: i18n.translate('wz-app-gdpr', {
            defaultMessage: 'GDPR',
          }),
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
          id: 'nist-800-53',
          title: i18n.translate('wz-app-nist-800-53', {
            defaultMessage: 'NIST 800-53',
          }),
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
          id: 'tsc',
          title: i18n.translate('wz-app-tsc', {
            defaultMessage: 'TSC',
          }),
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
          id: 'it-hygiene',
          title: i18n.translate('wz-app-it-hygiene', {
            defaultMessage: 'IT Hygiene',
          }),
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
          id: 'osquery',
          title: i18n.translate('wz-app-osquery', {
            defaultMessage: 'Osquery',
          }),
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
          id: 'amazon-web-services',
          title: i18n.translate('wz-app-amazon-web-services', {
            defaultMessage: 'Amazon Web Services',
          }),
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
          id: 'google-cloud',
          title: i18n.translate('wz-app-google-cloud', {
            defaultMessage: 'Google Cloud',
          }),
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
          id: 'github',
          title: i18n.translate('wz-app-github', {
            defaultMessage: 'GitHub',
          }),
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
          id: 'office365',
          title: i18n.translate('wz-app-office365', {
            defaultMessage: 'Office 365',
          }),
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
          id: 'docker-listener',
          title: i18n.translate('wz-app-docker-listener', {
            defaultMessage: 'Docker listener',
          }),
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
          id: 'rules',
          title: i18n.translate('wz-app-rules', {
            defaultMessage: 'Rules',
          }),
          redirectTo: () => '/manager/?tab=ruleset',
        },
        {
          category: categoryServerManagement,
          id: 'decoders',
          title: i18n.translate('wz-app-decoders', {
            defaultMessage: 'Decoders',
          }),
          redirectTo: () => '/manager/?tab=decoders',
        },
        {
          category: categoryServerManagement,
          id: 'cdb-lists',
          title: i18n.translate('wz-app-lists', {
            defaultMessage: 'CDB Lists',
          }),
          redirectTo: () => '/manager/?tab=lists',
        },
        {
          category: categoryServerManagement,
          id: 'groups',
          title: i18n.translate('wz-app-groups', {
            defaultMessage: 'Groups',
          }),
          redirectTo: () => '/manager/?tab=groups',
        },
        {
          category: categoryServerManagement,
          id: 'server-status',
          title: i18n.translate('wz-app-status', {
            defaultMessage: 'Status',
          }),
          redirectTo: () => '/manager/?tab=status',
        },
        {
          category: categoryServerManagement,
          id: 'cluster',
          title: i18n.translate('wz-app-cluster', {
            defaultMessage: 'Cluster',
          }),
          redirectTo: () => '/manager/?tab=monitoring',
        },
        {
          category: categoryServerManagement,
          id: 'statistics',
          title: i18n.translate('wz-app-statistics', {
            defaultMessage: 'Statistics',
          }),
          redirectTo: () => '/manager/?tab=statistics',
        },
        {
          category: categoryServerManagement,
          id: 'logs',
          title: i18n.translate('wz-app-logs', {
            defaultMessage: 'Logs',
          }),
          redirectTo: () => '/manager/?tab=logs',
        },
        {
          category: categoryServerManagement,
          id: 'reporting',
          title: i18n.translate('wz-app-reporting', {
            defaultMessage: 'Reporting',
          }),
          redirectTo: () => '/manager/?tab=reporting',
        },
        {
          category: categoryServerManagement,
          id: 'settings',
          title: i18n.translate('wz-app-settings', {
            defaultMessage: 'Settings',
          }),
          redirectTo: () => '/manager/?tab=configuration',
        },
        {
          category: categoryServerManagement,
          id: 'api-console',
          title: i18n.translate('wz-app-api-console', {
            defaultMessage: 'API console',
          }),
          redirectTo: () => '/wazuh-dev/?tab=devTools',
        },
        {
          category: categoryServerManagement,
          id: 'ruleset-test',
          title: i18n.translate('wz-app-ruleset-test', {
            defaultMessage: 'Ruleset test',
          }),
          redirectTo: () => '/wazuh-dev/?tab=logtest',
        },
        {
          category: categoryServerManagement,
          id: 'rbac',
          title: i18n.translate('wz-app-rbac', {
            defaultMessage: 'RBAC',
          }),
          redirectTo: () => '/security/?tab=users',
        },
        {
          category: DEFAULT_APP_CATEGORIES.management,
          id: 'server-api',
          title: i18n.translate('wz-app-server-api', {
            defaultMessage: 'Server API',
          }),
          redirectTo: () => '/settings?tab=api',
        },
        {
          category: DEFAULT_APP_CATEGORIES.management,
          id: 'modules',
          title: i18n.translate('wz-app-modules', {
            defaultMessage: 'Modules',
          }),
          redirectTo: () => '/settings?tab=modules',
        },
        {
          category: DEFAULT_APP_CATEGORIES.management,
          id: 'server-data',
          title: i18n.translate('wz-app-server-data', {
            defaultMessage: 'Server data',
          }),
          redirectTo: () => '/settings?tab=sample_data',
        },
        {
          category: DEFAULT_APP_CATEGORIES.management,
          id: 'configuration',
          title: i18n.translate('wz-app-configuration', {
            defaultMessage: 'Configuration',
          }),
          redirectTo: () => '/settings?tab=configuration',
        },
        {
          category: DEFAULT_APP_CATEGORIES.management,
          id: 'app-logs',
          title: i18n.translate('wz-app-app-logs', {
            defaultMessage: 'Logs',
          }),
          redirectTo: () => '/settings?tab=logs',
        },
        {
          category: DEFAULT_APP_CATEGORIES.management,
          id: 'about',
          title: i18n.translate('wz-app-about', {
            defaultMessage: 'About',
          }),
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
