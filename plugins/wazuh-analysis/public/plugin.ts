import { i18n } from '@osd/i18n';
import {
  AppCategory,
  AppMount,
  AppMountParameters,
  ChromeNavGroup,
  NavGroupItemInMap,
} from 'opensearch-dashboards/public';
import { first } from 'rxjs/operators';
import { Subject } from 'rxjs';
import {
  App,
  AppNavLinkStatus,
  CoreSetup,
  CoreStart,
  Plugin,
  DEFAULT_NAV_GROUPS,
} from '../../../src/core/public';
import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';
import { AnalysisSetup, AnalysisStart } from './types';

interface AnalysisSetupDependencies {}

interface AnalysisStartDependencies {
  navigation: NavigationPublicPluginStart;
}

const makeNavLinkStatusVisible = (): Partial<App> => ({
  navLinkStatus: AppNavLinkStatus.visible,
});
const makeNavLinkStatusHidden = (): Partial<App> => ({
  navLinkStatus: AppNavLinkStatus.hidden,
});
const getCurrentNavGroup = async (core: CoreStart) =>
  core.chrome.navGroup.getCurrentNavGroup$().pipe(first()).toPromise();

/**
 * The function `navigateToFirstAppInNavGroup` navigates to the first app in a
 * specified navigation group if it exists.
 * @param {CoreStart} core - The `core` parameter is an object that provides access
 * to core services in Kibana, such as application navigation, HTTP requests, and
 * more. It is typically provided by the Kibana platform to plugins and can be used
 * to interact with various functionalities within the Kibana application.
 * @param {NavGroupItemInMap | undefined} navGroup - The `navGroup` parameter is
 * expected to be an object that represents a navigation group item in a map. It
 * should have a property `navLinks` which is an array of navigation links. Each
 * navigation link in the `navLinks` array should have an `id` property that
 * represents the ID
 */
const navigateToFirstAppInNavGroup = async (
  core: CoreStart,
  navGroup: NavGroupItemInMap | undefined,
) => {
  // Get the first nav item, if it exists navigate to the app
  const firstNavItem = navGroup?.navLinks[0];

  if (firstNavItem?.id) {
    core.application.navigateToApp(firstNavItem.id);
  }
};

/**
 * The function `generateSubAppId` takes a parent app ID and a sub app ID, and
 * returns a combined ID with the sub app ID URL-encoded.
 * @param {string} parentAppId - The `parentAppId` parameter is a string
 * representing the ID of the parent application.
 * @param {string} subAppId - The `subAppId` parameter is a string representing the
 * ID of a sub-application within a parent application.
 */
const generateSubAppId = (parentAppId: string, subAppId: string) =>
  `${parentAppId}_${encodeURIComponent(`/${subAppId}`)}`;

export class AnalysisPlugin
  implements
    Plugin<AnalysisSetup, AnalysisStart, object, AnalysisStartDependencies>
{
  private readonly appStartup$ = new Subject<string>();
  private readonly endpointSecurityAppsStatusUpdater$ = new Subject<
    () => object
  >();
  private readonly PLUGIN_ID = 'analysis';
  private readonly ENDPOINT_SECURITY_ID = 'endpoint_security';
  private readonly THREAT_INTELLIGENCE_ID = 'threat_intelligence';
  private readonly SECURITY_OPERATIONS_ID = 'security_operations';
  private readonly CLOUD_SECURITY_ID = 'cloud_security';
  private readonly CONFIGURATION_ASSESSMENT_ID = generateSubAppId(
    this.ENDPOINT_SECURITY_ID,
    'configuration_assessment',
  );
  private readonly MALWARE_DETECTION_ID = generateSubAppId(
    this.ENDPOINT_SECURITY_ID,
    'malware_detection',
  );
  private readonly FIM_ID = generateSubAppId(this.ENDPOINT_SECURITY_ID, 'fim');
  private readonly translationMessages = {
    ANALYSIS_PLUGIN_TITLE: i18n.translate('analysis.title', {
      defaultMessage: 'Analysis',
    }),
    ENDPOINT_SECURITY_TITLE: i18n.translate(
      `${this.PLUGIN_ID}.category.${this.ENDPOINT_SECURITY_ID}`,
      {
        defaultMessage: 'Endpoint Security',
      },
    ),
    ENDPOINT_SECURITY_DESCRIPTION: i18n.translate(
      `${this.PLUGIN_ID}.category.${this.ENDPOINT_SECURITY_ID}.description`,
      {
        defaultMessage:
          'Advanced monitoring and protection for devices against security threats.',
      },
    ),
    THREAT_INTELLIGENCE_TITLE: i18n.translate(
      `${this.PLUGIN_ID}.category.${this.THREAT_INTELLIGENCE_ID}`,
      {
        defaultMessage: 'Threat Intelligence',
      },
    ),
    SECURITY_OPERATIONS_TITLE: i18n.translate(
      `${this.PLUGIN_ID}.category.${this.SECURITY_OPERATIONS_ID}`,
      {
        defaultMessage: 'Security Operations',
      },
    ),
    CLOUD_SECURITY_TITLE: i18n.translate(
      `${this.PLUGIN_ID}.category.${this.CLOUD_SECURITY_ID}`,
      {
        defaultMessage: 'Cloud Security',
      },
    ),
    CONFIGURATION_ASSESSMENT_TITLE: i18n.translate(
      `${this.PLUGIN_ID}.category.${this.CONFIGURATION_ASSESSMENT_ID}`,
      {
        defaultMessage: 'Configuration Assessment',
      },
    ),
    MALWARE_DETECTION_TITLE: i18n.translate(
      `${this.PLUGIN_ID}.category.${this.MALWARE_DETECTION_ID}`,
      {
        defaultMessage: 'Malware Detection',
      },
    ),
    FIM_TITLE: i18n.translate(`${this.PLUGIN_ID}.category.${this.FIM_ID}`, {
      defaultMessage: 'File Integrity Monitoring',
    }),
  };
  private readonly CATEGORY: AppCategory = {
    id: this.PLUGIN_ID,
    label: this.translationMessages.ANALYSIS_PLUGIN_TITLE,
    order: 5000,
  };

  public setup(
    core: CoreSetup,
    _plugins: AnalysisSetupDependencies,
  ): AnalysisSetup | Promise<AnalysisSetup> {
    console.debug('AnalysisPlugin started');

    const applications: App[] = [
      {
        id: this.ENDPOINT_SECURITY_ID,
        title: this.translationMessages.ENDPOINT_SECURITY_TITLE,
        mount: async (_params: AppMountParameters) => {
          this.endpointSecurityAppsStatusUpdater$.next(
            makeNavLinkStatusVisible,
          );
          this.appStartup$.next(this.ENDPOINT_SECURITY_ID);

          // TODO: Implement the endpoint security landing page
          return () => {};
        },
      },
      {
        id: this.THREAT_INTELLIGENCE_ID,
        title: this.translationMessages.THREAT_INTELLIGENCE_TITLE,
        mount: async (params: AppMountParameters) => {
          // TODO: Implement the threat intelligence application
          const { renderApp } = await import('./application');

          return renderApp(params, {});
        },
      },
      {
        id: this.SECURITY_OPERATIONS_ID,
        title: this.translationMessages.SECURITY_OPERATIONS_TITLE,
        category: this.CATEGORY,
        mount: async (params: AppMountParameters) => {
          // TODO: Implement the security operations application
          const { renderApp } = await import('./application');

          return renderApp(params, {});
        },
      },
      {
        id: this.CLOUD_SECURITY_ID,
        title: this.translationMessages.CLOUD_SECURITY_TITLE,
        category: this.CATEGORY,
        mount: async (params: AppMountParameters) => {
          // TODO: Implement the cloud security application
          const { renderApp } = await import('./application');

          return renderApp(params, {});
        },
      },
    ];
    const endpointSecurityApps: App[] = [
      {
        id: this.CONFIGURATION_ASSESSMENT_ID,
        title: this.translationMessages.CONFIGURATION_ASSESSMENT_TITLE,
        navLinkStatus: AppNavLinkStatus.hidden,
        updater$: this.endpointSecurityAppsStatusUpdater$,
        mount: async (params: AppMountParameters) => {
          // TODO: Implement the configuration assessment application
          const { renderApp } = await import('./application');

          return await renderApp(params, {});
        },
      },
      {
        id: this.MALWARE_DETECTION_ID,
        title: this.translationMessages.MALWARE_DETECTION_TITLE,
        navLinkStatus: AppNavLinkStatus.hidden,
        updater$: this.endpointSecurityAppsStatusUpdater$,
        mount: async (params: AppMountParameters) => {
          // TODO: Implement the malware detection application
          const { renderApp } = await import('./application');

          return await renderApp(params, {});
        },
      },
      {
        id: this.FIM_ID,
        title: this.translationMessages.FIM_TITLE,
        navLinkStatus: AppNavLinkStatus.hidden,
        updater$: this.endpointSecurityAppsStatusUpdater$,
        mount: async (params: AppMountParameters) => {
          // TODO: Implement the fim application
          const { renderApp } = await import('./application');

          return await renderApp(params, {});
        },
      },
    ];

    for (const app of endpointSecurityApps) {
      const mount = app.mount.bind(app) as AppMount;

      app.mount = async (params: AppMountParameters) => {
        this.endpointSecurityAppsStatusUpdater$.next(makeNavLinkStatusVisible);

        const unmount = await mount(params);

        return () => {
          this.endpointSecurityAppsStatusUpdater$.next(makeNavLinkStatusHidden);
          unmount();
        };
      };

      applications.push(app);
    }

    for (const app of applications) {
      core.application.register(app);
    }

    const navGroups = {
      [this.ENDPOINT_SECURITY_ID]: {
        id: this.ENDPOINT_SECURITY_ID,
        title: this.translationMessages.ENDPOINT_SECURITY_TITLE,
        description: this.translationMessages.ENDPOINT_SECURITY_DESCRIPTION,
      },
    } satisfies Record<string, ChromeNavGroup>;

    core.chrome.navGroup.addNavLinksToGroup(
      navGroups[this.ENDPOINT_SECURITY_ID],
      [
        {
          // Configuration assessment
          id: this.CONFIGURATION_ASSESSMENT_ID,
          title: this.translationMessages.CONFIGURATION_ASSESSMENT_TITLE,
        },
        {
          // Malware detection
          id: this.MALWARE_DETECTION_ID,
          title: this.translationMessages.MALWARE_DETECTION_TITLE,
        },
        {
          // FIM
          id: this.FIM_ID,
          title: this.translationMessages.FIM_TITLE,
        },
      ],
    );

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.all, [
      {
        id: this.ENDPOINT_SECURITY_ID,
        title: this.translationMessages.ENDPOINT_SECURITY_TITLE,
        order: 0,
        category: this.CATEGORY,
      },
      {
        id: this.THREAT_INTELLIGENCE_ID,
        title: this.translationMessages.THREAT_INTELLIGENCE_TITLE,
        order: 1,
        category: this.CATEGORY,
      },
      {
        id: this.SECURITY_OPERATIONS_ID,
        title: this.translationMessages.SECURITY_OPERATIONS_TITLE,
        order: 2,
        category: this.CATEGORY,
      },
      {
        id: this.CLOUD_SECURITY_ID,
        title: this.translationMessages.CLOUD_SECURITY_TITLE,
        order: 3,
        category: this.CATEGORY,
      },
    ]);

    return {};
  }

  start(
    core: CoreStart,
    _plugins: AnalysisStartDependencies,
  ): AnalysisStart | Promise<AnalysisStart> {
    this.appStartup$.subscribe({
      next: async (navGroupId: string) => {
        core.chrome.navGroup.setCurrentNavGroup(navGroupId);

        const currentNavGroup = await getCurrentNavGroup(core);

        navigateToFirstAppInNavGroup(core, currentNavGroup);
      },
    });

    return {};
  }

  stop?(): void {}
}
