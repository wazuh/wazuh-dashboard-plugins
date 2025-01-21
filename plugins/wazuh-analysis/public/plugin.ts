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

/**
 * The function `generateSubAppId` takes a parent app ID and a sub app ID, and
 * returns a combined ID with the sub app ID URL-encoded.
 * @param {string} parentAppId - The `parentAppId` parameter is a string
 * representing the ID of the parent application.
 * @param {string} subAppId - The `subAppId` parameter is a string representing the
 * ID of a sub-application within a parent application.
 */
function generateSubAppId(parentAppId: string, subAppId: string) {
  return `${parentAppId}_${encodeURIComponent(`/${subAppId}`)}`;
}

const PLUGIN_ID = 'analysis';
const ENDPOINT_SECURITY_ID = 'endpoint_security';
const THREAT_INTELLIGENCE_ID = 'threat_intelligence';
const SECURITY_OPERATIONS_ID = 'security_operations';
const CLOUD_SECURITY_ID = 'cloud_security';

type ParentAppId =
  | typeof ENDPOINT_SECURITY_ID
  | typeof THREAT_INTELLIGENCE_ID
  | typeof SECURITY_OPERATIONS_ID
  | typeof CLOUD_SECURITY_ID;

const CONFIGURATION_ASSESSMENT_ID = generateSubAppId(
  ENDPOINT_SECURITY_ID,
  'configuration_assessment',
);
const MALWARE_DETECTION_ID = generateSubAppId(
  ENDPOINT_SECURITY_ID,
  'malware_detection',
);
const FIM_ID = generateSubAppId(ENDPOINT_SECURITY_ID, 'fim');
const TRANSLATION_MESSAGES = Object.freeze({
  ANALYSIS_PLUGIN_TITLE: i18n.translate('analysis.title', {
    defaultMessage: 'Analysis',
  }),
  ENDPOINT_SECURITY_TITLE: i18n.translate(
    `${PLUGIN_ID}.category.${ENDPOINT_SECURITY_ID}`,
    {
      defaultMessage: 'Endpoint Security',
    },
  ),
  ENDPOINT_SECURITY_DESCRIPTION: i18n.translate(
    `${PLUGIN_ID}.category.${ENDPOINT_SECURITY_ID}.description`,
    {
      defaultMessage:
        'Advanced monitoring and protection for devices against security threats.',
    },
  ),
  THREAT_INTELLIGENCE_TITLE: i18n.translate(
    `${PLUGIN_ID}.category.${THREAT_INTELLIGENCE_ID}`,
    {
      defaultMessage: 'Threat Intelligence',
    },
  ),
  SECURITY_OPERATIONS_TITLE: i18n.translate(
    `${PLUGIN_ID}.category.${SECURITY_OPERATIONS_ID}`,
    {
      defaultMessage: 'Security Operations',
    },
  ),
  CLOUD_SECURITY_TITLE: i18n.translate(
    `${PLUGIN_ID}.category.${CLOUD_SECURITY_ID}`,
    {
      defaultMessage: 'Cloud Security',
    },
  ),
  CONFIGURATION_ASSESSMENT_TITLE: i18n.translate(
    `${PLUGIN_ID}.category.${CONFIGURATION_ASSESSMENT_ID}`,
    {
      defaultMessage: 'Configuration Assessment',
    },
  ),
  MALWARE_DETECTION_TITLE: i18n.translate(
    `${PLUGIN_ID}.category.${MALWARE_DETECTION_ID}`,
    {
      defaultMessage: 'Malware Detection',
    },
  ),
  FIM_TITLE: i18n.translate(`${PLUGIN_ID}.category.${FIM_ID}`, {
    defaultMessage: 'File Integrity Monitoring',
  }),
});
const CATEGORY: AppCategory = Object.freeze({
  id: PLUGIN_ID,
  label: TRANSLATION_MESSAGES.ANALYSIS_PLUGIN_TITLE,
  order: 5000,
});
const NAV_GROUPS = Object.freeze({
  [ENDPOINT_SECURITY_ID]: {
    id: ENDPOINT_SECURITY_ID,
    title: TRANSLATION_MESSAGES.ENDPOINT_SECURITY_TITLE,
    description: TRANSLATION_MESSAGES.ENDPOINT_SECURITY_DESCRIPTION,
  },
} satisfies Partial<Record<ParentAppId, ChromeNavGroup>>);

function makeNavLinkStatusVisible(): Partial<App> {
  return {
    navLinkStatus: AppNavLinkStatus.visible,
  };
}

function makeNavLinkStatusHidden(): Partial<App> {
  return {
    navLinkStatus: AppNavLinkStatus.hidden,
  };
}

async function getCurrentNavGroup(core: CoreStart) {
  return core.chrome.navGroup.getCurrentNavGroup$().pipe(first()).toPromise();
}

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

export class AnalysisPlugin
  implements
    Plugin<AnalysisSetup, AnalysisStart, object, AnalysisStartDependencies>
{
  private readonly appStartup$ = new Subject<string>();
  private readonly appStatusUpdater$: Partial<
    Record<ParentAppId, Subject<object>>
  > = {
    [ENDPOINT_SECURITY_ID]: new Subject<object>(),
  };

  private registerApps(core: CoreSetup) {
    const applications: App[] = [
      {
        id: ENDPOINT_SECURITY_ID,
        title: TRANSLATION_MESSAGES.ENDPOINT_SECURITY_TITLE,
        category: CATEGORY,
        mount: async (_params: AppMountParameters) => {
          this.appStatusUpdater$[ENDPOINT_SECURITY_ID].next(
            makeNavLinkStatusVisible,
          );
          this.appStartup$.next(ENDPOINT_SECURITY_ID);

          // TODO: Implement the endpoint security landing page
          return () => {};
        },
      },
      {
        id: THREAT_INTELLIGENCE_ID,
        title: TRANSLATION_MESSAGES.THREAT_INTELLIGENCE_TITLE,
        category: CATEGORY,
        mount: async (params: AppMountParameters) => {
          // TODO: Implement the threat intelligence application
          const { renderApp } = await import('./application');

          return renderApp(params, {});
        },
      },
      {
        id: SECURITY_OPERATIONS_ID,
        title: TRANSLATION_MESSAGES.SECURITY_OPERATIONS_TITLE,
        category: CATEGORY,
        mount: async (params: AppMountParameters) => {
          // TODO: Implement the security operations application
          const { renderApp } = await import('./application');

          return renderApp(params, {});
        },
      },
      {
        id: CLOUD_SECURITY_ID,
        title: TRANSLATION_MESSAGES.CLOUD_SECURITY_TITLE,
        category: CATEGORY,
        mount: async (params: AppMountParameters) => {
          // TODO: Implement the cloud security application
          const { renderApp } = await import('./application');

          return renderApp(params, {});
        },
      },
    ];
    const subApps = {
      [ENDPOINT_SECURITY_ID]: [
        {
          id: CONFIGURATION_ASSESSMENT_ID,
          title: TRANSLATION_MESSAGES.CONFIGURATION_ASSESSMENT_TITLE,
          navLinkStatus: AppNavLinkStatus.hidden,
          updater$: this.appStatusUpdater$[ENDPOINT_SECURITY_ID],
          mount: async (params: AppMountParameters) => {
            // TODO: Implement the configuration assessment application
            const { renderApp } = await import('./application');

            return await renderApp(params, {});
          },
        },
        {
          id: MALWARE_DETECTION_ID,
          title: TRANSLATION_MESSAGES.MALWARE_DETECTION_TITLE,
          navLinkStatus: AppNavLinkStatus.hidden,
          updater$: this.appStatusUpdater$[ENDPOINT_SECURITY_ID],
          mount: async (params: AppMountParameters) => {
            // TODO: Implement the malware detection application
            const { renderApp } = await import('./application');

            return await renderApp(params, {});
          },
        },
        {
          id: FIM_ID,
          title: TRANSLATION_MESSAGES.FIM_TITLE,
          navLinkStatus: AppNavLinkStatus.hidden,
          updater$: this.appStatusUpdater$[ENDPOINT_SECURITY_ID],
          mount: async (params: AppMountParameters) => {
            // TODO: Implement the fim application
            const { renderApp } = await import('./application');

            return await renderApp(params, {});
          },
        },
      ],
    } satisfies Partial<Record<ParentAppId, App[]>>;

    for (const app of subApps[ENDPOINT_SECURITY_ID]) {
      const mount = app.mount.bind(app) as AppMount;

      app.mount = async (params: AppMountParameters) => {
        this.appStatusUpdater$[ENDPOINT_SECURITY_ID].next(
          makeNavLinkStatusVisible,
        );

        const unmount = await mount(params);

        return () => {
          this.appStatusUpdater$[ENDPOINT_SECURITY_ID].next(
            makeNavLinkStatusHidden,
          );
          unmount();
        };
      };

      applications.push(app);
    }

    for (const app of applications) {
      core.application.register(app);
    }
  }

  private registerNavGroups(core: CoreSetup) {
    core.chrome.navGroup.addNavLinksToGroup(NAV_GROUPS[ENDPOINT_SECURITY_ID], [
      {
        // Configuration assessment
        id: CONFIGURATION_ASSESSMENT_ID,
        title: TRANSLATION_MESSAGES.CONFIGURATION_ASSESSMENT_TITLE,
      },
      {
        // Malware detection
        id: MALWARE_DETECTION_ID,
        title: TRANSLATION_MESSAGES.MALWARE_DETECTION_TITLE,
      },
      {
        // FIM
        id: FIM_ID,
        title: TRANSLATION_MESSAGES.FIM_TITLE,
      },
    ]);

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.all, [
      {
        id: ENDPOINT_SECURITY_ID,
        title: TRANSLATION_MESSAGES.ENDPOINT_SECURITY_TITLE,
        order: 0,
        category: CATEGORY,
      },
      {
        id: THREAT_INTELLIGENCE_ID,
        title: TRANSLATION_MESSAGES.THREAT_INTELLIGENCE_TITLE,
        order: 1,
        category: CATEGORY,
      },
      {
        id: SECURITY_OPERATIONS_ID,
        title: TRANSLATION_MESSAGES.SECURITY_OPERATIONS_TITLE,
        order: 2,
        category: CATEGORY,
      },
      {
        id: CLOUD_SECURITY_ID,
        title: TRANSLATION_MESSAGES.CLOUD_SECURITY_TITLE,
        order: 3,
        category: CATEGORY,
      },
    ]);
  }

  public setup(
    core: CoreSetup,
    _plugins: AnalysisSetupDependencies,
  ): AnalysisSetup | Promise<AnalysisSetup> {
    console.debug('AnalysisPlugin started');

    this.registerApps(core);
    this.registerNavGroups(core);

    return {};
  }

  private subscribeToAppStartup(core: CoreStart) {
    this.appStartup$.subscribe({
      next: async (navGroupId: string) => {
        core.chrome.navGroup.setCurrentNavGroup(navGroupId);

        const currentNavGroup = await getCurrentNavGroup(core);

        navigateToFirstAppInNavGroup(core, currentNavGroup);
      },
    });
  }

  start(
    core: CoreStart,
    _plugins: AnalysisStartDependencies,
  ): AnalysisStart | Promise<AnalysisStart> {
    this.subscribeToAppStartup(core);

    return {};
  }

  stop?(): void {}
}
