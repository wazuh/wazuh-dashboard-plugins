import { i18n } from '@osd/i18n';
import {
  AppMount,
  AppMountParameters,
  AppUpdater,
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
import { PLUGIN_ID } from '../common/constants';
import { AnalysisSetup, AnalysisStart } from './types';
import { CATEGORY } from './groups/category';
import {
  ENDPOINT_SECURITY_ID,
  ENDPOINT_SECURITY_TITLE,
  EndpointSecurityApp,
} from './groups/endpoint-security/endpoint-security';
import { searchPages } from './components/global_search/search-pages-command';
import {
  THREAT_INTELLIGENCE_ID,
  THREAT_INTELLIGENCE_TITLE,
  ThreatIntelligenceApp,
} from './groups/threat-intelligence/threat-intelligence';
import {
  SECURITY_OPERATIONS_ID,
  SECURITY_OPERATIONS_TITLE,
  SecurityOperationsApp,
} from './groups/security-operations/security-operations';
import {
  CLOUD_SECURITY_ID,
  CLOUD_SECURITY_TITLE,
  CloudSecurityApp,
} from './groups/cloud-security/cloud-security';
import { NAV_GROUPS } from './groups/nav-groups';
import { buildSubAppId, navigateToFirstAppInNavGroup } from './utils';

interface AnalysisSetupDependencies {}

interface AnalysisStartDependencies {
  navigation: NavigationPublicPluginStart;
}

type ParentAppId =
  | typeof ENDPOINT_SECURITY_ID
  | typeof THREAT_INTELLIGENCE_ID
  | typeof SECURITY_OPERATIONS_ID
  | typeof CLOUD_SECURITY_ID;

const CONFIGURATION_ASSESSMENT_ID = buildSubAppId(
  ENDPOINT_SECURITY_ID,
  'configuration_assessment',
);
const MALWARE_DETECTION_ID = buildSubAppId(
  ENDPOINT_SECURITY_ID,
  'malware_detection',
);
const FIM_ID = buildSubAppId(ENDPOINT_SECURITY_ID, 'fim');
const THREAT_HUNTING_ID = buildSubAppId(
  THREAT_INTELLIGENCE_ID,
  'threat_hunting',
);
const VULNERABILITY_DETECTION_ID = buildSubAppId(
  THREAT_INTELLIGENCE_ID,
  'vulnerability_detection',
);
const MITRE_ATTACK_ID = buildSubAppId(THREAT_INTELLIGENCE_ID, 'mitre_attack');
const REGULATORY_COMPLIANCE_ID = buildSubAppId(
  SECURITY_OPERATIONS_ID,
  'regulatory_compliance',
);
const IT_HYGIENE_ID = buildSubAppId(SECURITY_OPERATIONS_ID, 'it_hygiene');
const INCIDENT_RESPONSE_ID = buildSubAppId(
  SECURITY_OPERATIONS_ID,
  'incident_response',
);
const DOCKER_ID = buildSubAppId(CLOUD_SECURITY_ID, 'docker');
const AWS_ID = buildSubAppId(CLOUD_SECURITY_ID, 'aws');
const GOOGLE_CLOUD_ID = buildSubAppId(CLOUD_SECURITY_ID, 'google_cloud');
const GITHUB_ID = buildSubAppId(CLOUD_SECURITY_ID, 'github');
const OFFICE365_ID = buildSubAppId(CLOUD_SECURITY_ID, 'office365');
const TRANSLATION_MESSAGES = Object.freeze({
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
  THREAT_HUNTING_TITLE: i18n.translate(
    `${PLUGIN_ID}.category.${THREAT_HUNTING_ID}`,
    {
      defaultMessage: 'Threat Hunting',
    },
  ),
  VULNERABILITY_DETECTION_TITLE: i18n.translate(
    `${PLUGIN_ID}.category.${VULNERABILITY_DETECTION_ID}`,
    {
      defaultMessage: 'Vulnerability Detection',
    },
  ),
  MITRE_ATTACK_TITLE: i18n.translate(
    `${PLUGIN_ID}.category.${MITRE_ATTACK_ID}`,
    {
      defaultMessage: 'MITRE ATT&CK',
    },
  ),
  REGULATORY_COMPLIANCE_TITLE: i18n.translate(
    `${PLUGIN_ID}.category.${REGULATORY_COMPLIANCE_ID}`,
    {
      defaultMessage: 'Regulatory Compliance',
    },
  ),
  IT_HYGIENE_TITLE: i18n.translate(`${PLUGIN_ID}.category.${IT_HYGIENE_ID}`, {
    defaultMessage: 'IT Hygiene',
  }),
  INCIDENT_RESPONSE_TITLE: i18n.translate(
    `${PLUGIN_ID}.category.${INCIDENT_RESPONSE_ID}`,
    {
      defaultMessage: 'Incident Response',
    },
  ),
  DOCKER_TITLE: i18n.translate(`${PLUGIN_ID}.category.${DOCKER_ID}`, {
    defaultMessage: 'Docker',
  }),
  AWS_TITLE: i18n.translate(`${PLUGIN_ID}.category.${AWS_ID}`, {
    defaultMessage: 'AWS',
  }),
  GOOGLE_CLOUD_TITLE: i18n.translate(
    `${PLUGIN_ID}.category.${GOOGLE_CLOUD_ID}`,
    {
      defaultMessage: 'Google Cloud',
    },
  ),
  GITHUB_TITLE: i18n.translate(`${PLUGIN_ID}.category.${GITHUB_ID}`, {
    defaultMessage: 'Github',
  }),
  OFFICE365_TITLE: i18n.translate(`${PLUGIN_ID}.category.${OFFICE365_ID}`, {
    defaultMessage: 'Office 365',
  }),
});

function setNavLinkVisible(): Partial<App> {
  return {
    navLinkStatus: AppNavLinkStatus.visible,
  };
}

function setNavLinkHidden(): Partial<App> {
  return {
    navLinkStatus: AppNavLinkStatus.hidden,
  };
}

async function getCurrentNavGroup(core: CoreStart) {
  return core.chrome.navGroup.getCurrentNavGroup$().pipe(first()).toPromise();
}

export class AnalysisPlugin
  implements
    Plugin<AnalysisSetup, AnalysisStart, object, AnalysisStartDependencies>
{
  private coreStart?: CoreStart;
  private readonly appStartup$ = new Subject<ParentAppId>();
  private readonly appStatusUpdater$ = {
    [ENDPOINT_SECURITY_ID]: new Subject(),
    [THREAT_INTELLIGENCE_ID]: new Subject(),
    [SECURITY_OPERATIONS_ID]: new Subject(),
    [CLOUD_SECURITY_ID]: new Subject(),
  } satisfies Partial<Record<ParentAppId, Subject<AppUpdater>>>;

  private registerApps(core: CoreSetup) {
    const applications: App[] = [
      EndpointSecurityApp(core),
      ThreatIntelligenceApp(core),
      SecurityOperationsApp(core),
      CloudSecurityApp(core),
    ];

    for (const app of applications) {
      const mount = app.mount.bind(app) as AppMount;

      app.mount = async (params: AppMountParameters) => {
        if (core.chrome.navGroup.getNavGroupEnabled()) {
          this.appStatusUpdater$[app.id as ParentAppId].next(setNavLinkVisible);
          this.appStartup$.next(app.id as ParentAppId);
        }

        return await mount(params);
      };

      core.application.register(app);
    }

    if (core.chrome.navGroup.getNavGroupEnabled()) {
      core.chrome.globalSearch.registerSearchCommand({
        id: 'wz-analysis',
        type: 'PAGES',
        run: async (query: string, done?: () => void) =>
          searchPages(
            query,
            applications.map(app => app.id),
            this.coreStart,
            done,
          ),
      });
    }

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
      [THREAT_INTELLIGENCE_ID]: [
        {
          id: THREAT_HUNTING_ID,
          title: TRANSLATION_MESSAGES.THREAT_HUNTING_TITLE,
          navLinkStatus: AppNavLinkStatus.hidden,
          updater$: this.appStatusUpdater$[THREAT_INTELLIGENCE_ID],
          mount: async (params: AppMountParameters) => {
            // TODO: Implement the threat hunting application
            const { renderApp } = await import('./application');

            return await renderApp(params, {});
          },
        },
        {
          id: VULNERABILITY_DETECTION_ID,
          title: TRANSLATION_MESSAGES.VULNERABILITY_DETECTION_TITLE,
          navLinkStatus: AppNavLinkStatus.hidden,
          updater$: this.appStatusUpdater$[THREAT_INTELLIGENCE_ID],
          mount: async (params: AppMountParameters) => {
            // TODO: Implement the vulnerability detection application
            const { renderApp } = await import('./application');

            return await renderApp(params, {});
          },
        },
        {
          id: MITRE_ATTACK_ID,
          title: TRANSLATION_MESSAGES.MITRE_ATTACK_TITLE,
          navLinkStatus: AppNavLinkStatus.hidden,
          updater$: this.appStatusUpdater$[THREAT_INTELLIGENCE_ID],
          mount: async (params: AppMountParameters) => {
            // TODO: Implement the mitre attack application
            const { renderApp } = await import('./application');

            return await renderApp(params, {});
          },
        },
      ],
      [SECURITY_OPERATIONS_ID]: [
        {
          id: REGULATORY_COMPLIANCE_ID,
          title: TRANSLATION_MESSAGES.REGULATORY_COMPLIANCE_TITLE,
          navLinkStatus: AppNavLinkStatus.hidden,
          updater$: this.appStatusUpdater$[SECURITY_OPERATIONS_ID],
          mount: async (params: AppMountParameters) => {
            // TODO: Implement the regulatory compliance application
            const { renderApp } = await import('./application');

            return await renderApp(params, {});
          },
        },
        {
          id: IT_HYGIENE_ID,
          title: TRANSLATION_MESSAGES.IT_HYGIENE_TITLE,
          navLinkStatus: AppNavLinkStatus.hidden,
          updater$: this.appStatusUpdater$[SECURITY_OPERATIONS_ID],
          mount: async (params: AppMountParameters) => {
            // TODO: Implement the it hygiene application
            const { renderApp } = await import('./application');

            return await renderApp(params, {});
          },
        },
        {
          id: INCIDENT_RESPONSE_ID,
          title: TRANSLATION_MESSAGES.INCIDENT_RESPONSE_TITLE,
          navLinkStatus: AppNavLinkStatus.hidden,
          updater$: this.appStatusUpdater$[SECURITY_OPERATIONS_ID],
          mount: async (params: AppMountParameters) => {
            // TODO: Implement the incident response application
            const { renderApp } = await import('./application');

            return await renderApp(params, {});
          },
        },
      ],
      [CLOUD_SECURITY_ID]: [
        {
          id: DOCKER_ID,
          title: TRANSLATION_MESSAGES.DOCKER_TITLE,
          navLinkStatus: AppNavLinkStatus.hidden,
          updater$: this.appStatusUpdater$[CLOUD_SECURITY_ID],
          mount: async (params: AppMountParameters) => {
            // TODO: Implement the docker application
            const { renderApp } = await import('./application');

            return await renderApp(params, {});
          },
        },
        {
          id: AWS_ID,
          title: TRANSLATION_MESSAGES.AWS_TITLE,
          navLinkStatus: AppNavLinkStatus.hidden,
          updater$: this.appStatusUpdater$[CLOUD_SECURITY_ID],
          mount: async (params: AppMountParameters) => {
            // TODO: Implement the aws application
            const { renderApp } = await import('./application');

            return await renderApp(params, {});
          },
        },
        {
          id: GOOGLE_CLOUD_ID,
          title: TRANSLATION_MESSAGES.GOOGLE_CLOUD_TITLE,
          navLinkStatus: AppNavLinkStatus.hidden,
          updater$: this.appStatusUpdater$[CLOUD_SECURITY_ID],
          mount: async (params: AppMountParameters) => {
            // TODO: Implement the google cloud application
            const { renderApp } = await import('./application');

            return await renderApp(params, {});
          },
        },
        {
          id: GITHUB_ID,
          title: TRANSLATION_MESSAGES.GITHUB_TITLE,
          navLinkStatus: AppNavLinkStatus.hidden,
          updater$: this.appStatusUpdater$[CLOUD_SECURITY_ID],
          mount: async (params: AppMountParameters) => {
            // TODO: Implement the github application
            const { renderApp } = await import('./application');

            return await renderApp(params, {});
          },
        },
        {
          id: OFFICE365_ID,
          title: TRANSLATION_MESSAGES.OFFICE365_TITLE,
          navLinkStatus: AppNavLinkStatus.hidden,
          updater$: this.appStatusUpdater$[CLOUD_SECURITY_ID],
          mount: async (params: AppMountParameters) => {
            // TODO: Implement the office365 application
            const { renderApp } = await import('./application');

            return await renderApp(params, {});
          },
        },
      ],
    } satisfies Partial<Record<ParentAppId, App[]>>;

    for (const parentAppId of Object.keys(subApps)) {
      this.setupAppMounts(subApps, parentAppId as ParentAppId, core);
    }
  }

  private setupAppMounts(
    subApps: Partial<Record<ParentAppId, App[]>>,
    navGroupId: ParentAppId,
    core: CoreSetup,
  ) {
    for (const app of subApps[navGroupId] ?? []) {
      const mount = app.mount.bind(app) as AppMount;

      app.mount = async (params: AppMountParameters) => {
        if (core.chrome.navGroup.getNavGroupEnabled()) {
          this.appStatusUpdater$[navGroupId].next(setNavLinkVisible);
        }

        const unmount = await mount(params);

        return () => {
          if (core.chrome.navGroup.getNavGroupEnabled()) {
            this.appStatusUpdater$[navGroupId].next(setNavLinkHidden);
          }

          unmount();

          return true;
        };
      };

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

    core.chrome.navGroup.addNavLinksToGroup(
      NAV_GROUPS[THREAT_INTELLIGENCE_ID],
      [
        {
          // Threat hunting
          id: THREAT_HUNTING_ID,
          title: TRANSLATION_MESSAGES.THREAT_HUNTING_TITLE,
        },
        {
          // Vulnerability detection
          id: VULNERABILITY_DETECTION_ID,
          title: TRANSLATION_MESSAGES.VULNERABILITY_DETECTION_TITLE,
        },
        {
          // MITRE ATT&CK
          id: MITRE_ATTACK_ID,
          title: TRANSLATION_MESSAGES.MITRE_ATTACK_TITLE,
        },
      ],
    );

    core.chrome.navGroup.addNavLinksToGroup(
      NAV_GROUPS[SECURITY_OPERATIONS_ID],
      [
        {
          // Regulatory compliance
          id: REGULATORY_COMPLIANCE_ID,
          title: TRANSLATION_MESSAGES.REGULATORY_COMPLIANCE_TITLE,
        },
        {
          // IT hygiene
          id: IT_HYGIENE_ID,
          title: TRANSLATION_MESSAGES.IT_HYGIENE_TITLE,
        },
        {
          // Incident response
          id: INCIDENT_RESPONSE_ID,
          title: TRANSLATION_MESSAGES.INCIDENT_RESPONSE_TITLE,
        },
      ],
    );

    core.chrome.navGroup.addNavLinksToGroup(NAV_GROUPS[CLOUD_SECURITY_ID], [
      {
        // Docker
        id: DOCKER_ID,
        title: TRANSLATION_MESSAGES.DOCKER_TITLE,
      },
      {
        // AWS
        id: AWS_ID,
        title: TRANSLATION_MESSAGES.AWS_TITLE,
      },
      {
        // Google Cloud
        id: GOOGLE_CLOUD_ID,
        title: TRANSLATION_MESSAGES.GOOGLE_CLOUD_TITLE,
      },
      {
        // Github
        id: GITHUB_ID,
        title: TRANSLATION_MESSAGES.GITHUB_TITLE,
      },
      {
        // Office 365
        id: OFFICE365_ID,
        title: TRANSLATION_MESSAGES.OFFICE365_TITLE,
      },
    ]);

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.all, [
      {
        id: ENDPOINT_SECURITY_ID,
        title: ENDPOINT_SECURITY_TITLE,
        order: 0,
        category: CATEGORY,
      },
      {
        id: THREAT_INTELLIGENCE_ID,
        title: THREAT_INTELLIGENCE_TITLE,
        order: 1,
        category: CATEGORY,
      },
      {
        id: SECURITY_OPERATIONS_ID,
        title: SECURITY_OPERATIONS_TITLE,
        order: 2,
        category: CATEGORY,
      },
      {
        id: CLOUD_SECURITY_ID,
        title: CLOUD_SECURITY_TITLE,
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
        if (core.chrome.navGroup.getNavGroupEnabled()) {
          core.chrome.navGroup.setCurrentNavGroup(navGroupId);

          const currentNavGroup = await getCurrentNavGroup(core);

          navigateToFirstAppInNavGroup(core, currentNavGroup);
        }
      },
    });
  }

  start(
    core: CoreStart,
    _plugins: AnalysisStartDependencies,
  ): AnalysisStart | Promise<AnalysisStart> {
    this.coreStart = core;
    this.subscribeToAppStartup(core);

    return {};
  }

  stop?(): void {}
}
