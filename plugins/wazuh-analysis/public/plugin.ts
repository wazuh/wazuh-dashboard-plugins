import { AppMount, AppMountParameters } from 'opensearch-dashboards/public';
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
import { CATEGORY } from './groups/category';
import {
  ENDPOINT_SECURITY_ID,
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
import { getCurrentNavGroup, navigateToFirstAppInNavGroup } from './utils';
import { getEndpointSecurityApps } from './groups/endpoint-security/applications';
import {
  getThreatIntelligenceApps,
  MITRE_ATTACK_ID,
  MITRE_ATTACK_TITLE,
  THREAT_HUNTING_ID,
  THREAT_HUNTING_TITLE,
  VULNERABILITY_DETECTION_ID,
  VULNERABILITY_DETECTION_TITLE,
} from './groups/threat-intelligence/applications';
import {
  getSecurityOperationsApps,
  INCIDENT_RESPONSE_ID,
  INCIDENT_RESPONSE_TITLE,
  IT_HYGIENE_ID,
  IT_HYGIENE_TITLE,
  REGULATORY_COMPLIANCE_ID,
  REGULATORY_COMPLIANCE_TITLE,
} from './groups/security-operations/applications';
import {
  AWS_ID,
  AWS_TITLE,
  DOCKER_ID,
  DOCKER_TITLE,
  getCloudSecurityApps,
  GITHUB_ID,
  GITHUB_TITLE,
  GOOGLE_CLOUD_ID,
  GOOGLE_CLOUD_TITLE,
  OFFICE365_ID,
  OFFICE365_TITLE,
} from './groups/cloud-security/applications';
import { GroupsId } from './groups/types';
import { setupEndpointSecurityNavGroup } from './groups/endpoint-security/nav-group';

interface AnalysisSetupDependencies {}

interface AnalysisStartDependencies {
  navigation: NavigationPublicPluginStart;
}

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

export class AnalysisPlugin
  implements
    Plugin<AnalysisSetup, AnalysisStart, object, AnalysisStartDependencies>
{
  private coreStart?: CoreStart;
  private readonly appStartup$ = new Subject<GroupsId>();
  private readonly appStatusUpdater$ = {
    [ENDPOINT_SECURITY_ID]: new Subject(),
    [THREAT_INTELLIGENCE_ID]: new Subject(),
    [SECURITY_OPERATIONS_ID]: new Subject(),
    [CLOUD_SECURITY_ID]: new Subject(),
  } satisfies Partial<Record<GroupsId, Subject<AppUpdater>>>;

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
          this.appStatusUpdater$[app.id as GroupsId].next(setNavLinkVisible);
          this.appStartup$.next(app.id as GroupsId);
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
      [ENDPOINT_SECURITY_ID]: getEndpointSecurityApps(
        this.appStatusUpdater$[ENDPOINT_SECURITY_ID],
      ),
      [THREAT_INTELLIGENCE_ID]: getThreatIntelligenceApps(
        this.appStatusUpdater$[THREAT_INTELLIGENCE_ID],
      ),
      [SECURITY_OPERATIONS_ID]: getSecurityOperationsApps(
        this.appStatusUpdater$[SECURITY_OPERATIONS_ID],
      ),
      [CLOUD_SECURITY_ID]: getCloudSecurityApps(
        this.appStatusUpdater$[CLOUD_SECURITY_ID],
      ),
    } satisfies Partial<Record<GroupsId, App[]>>;

    for (const parentAppId of Object.keys(subApps)) {
      this.setupAppMounts(subApps, parentAppId as GroupsId, core);
    }
  }

  private setupAppMounts(
    subApps: Partial<Record<GroupsId, App[]>>,
    navGroupId: GroupsId,
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
    registerEndpointSecurityNavLinksToGroup(core);

    core.chrome.navGroup.addNavLinksToGroup(
      NAV_GROUPS[THREAT_INTELLIGENCE_ID],
      [
        {
          // Threat hunting
          id: THREAT_HUNTING_ID,
          title: THREAT_HUNTING_TITLE,
        },
        {
          // Vulnerability detection
          id: VULNERABILITY_DETECTION_ID,
          title: VULNERABILITY_DETECTION_TITLE,
        },
        {
          // MITRE ATT&CK
          id: MITRE_ATTACK_ID,
          title: MITRE_ATTACK_TITLE,
        },
      ],
    );

    core.chrome.navGroup.addNavLinksToGroup(
      NAV_GROUPS[SECURITY_OPERATIONS_ID],
      [
        {
          // Regulatory compliance
          id: REGULATORY_COMPLIANCE_ID,
          title: REGULATORY_COMPLIANCE_TITLE,
        },
        {
          // IT hygiene
          id: IT_HYGIENE_ID,
          title: IT_HYGIENE_TITLE,
        },
        {
          // Incident response
          id: INCIDENT_RESPONSE_ID,
          title: INCIDENT_RESPONSE_TITLE,
        },
      ],
    );

    core.chrome.navGroup.addNavLinksToGroup(NAV_GROUPS[CLOUD_SECURITY_ID], [
      {
        // Docker
        id: DOCKER_ID,
        title: DOCKER_TITLE,
      },
      {
        // AWS
        id: AWS_ID,
        title: AWS_TITLE,
      },
      {
        // Google Cloud
        id: GOOGLE_CLOUD_ID,
        title: GOOGLE_CLOUD_TITLE,
      },
      {
        // Github
        id: GITHUB_ID,
        title: GITHUB_TITLE,
      },
      {
        // Office 365
        id: OFFICE365_ID,
        title: OFFICE365_TITLE,
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
