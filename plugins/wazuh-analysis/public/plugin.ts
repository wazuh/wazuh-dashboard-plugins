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
import { ApplicationService } from './services/application.service';
import {
  ENDPOINT_SECURITY_ID,
  EndpointSecurityNavGroup,
} from './groups/endpoint-security';

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
  private readonly applicationService = new ApplicationService();
  private coreStart?: CoreStart;
  private readonly navGroupsIds: GroupsId[] = [
    ENDPOINT_SECURITY_ID,
    THREAT_INTELLIGENCE_ID,
    SECURITY_OPERATIONS_ID,
    CLOUD_SECURITY_ID,
  ];

  constructor() {
    for (const navGroupId of this.navGroupsIds) {
      this.applicationService.registerAppUpdater(navGroupId);
    }
  }

  private registerApps(core: CoreSetup) {
    const applications: App[] = [
      EndpointSecurityNavGroup.getAppGroup(),
      ThreatIntelligenceApp(core),
      SecurityOperationsApp(core),
      CloudSecurityApp(core),
    ];

    this.applicationService.initializeNavGroupMounts(applications, core, {
      prepareApp: setNavLinkVisible,
    });

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

    const subApps: Partial<Record<GroupsId, App[]>> = {
      [ENDPOINT_SECURITY_ID]: EndpointSecurityNavGroup.getApps(
        this.applicationService.getAppUpdater(ENDPOINT_SECURITY_ID),
      ),
      [THREAT_INTELLIGENCE_ID]: getThreatIntelligenceApps(
        this.applicationService.getAppUpdater(THREAT_INTELLIGENCE_ID),
      ),
      [SECURITY_OPERATIONS_ID]: getSecurityOperationsApps(
        this.applicationService.getAppUpdater(SECURITY_OPERATIONS_ID),
      ),
      [CLOUD_SECURITY_ID]: getCloudSecurityApps(
        this.applicationService.getAppUpdater(CLOUD_SECURITY_ID),
      ),
    };

    for (const apps of Object.values(subApps)) {
      this.applicationService.initializeSubApplicationMounts(apps, core, {
        prepareApp: setNavLinkVisible,
        teardownApp: setNavLinkHidden,
      });
    }
  }

  private registerNavGroups(core: CoreSetup) {
    EndpointSecurityNavGroup.addNavLinks(core);

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
      EndpointSecurityNavGroup.getGroupNavLink(),
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

  start(
    core: CoreStart,
    _plugins: AnalysisStartDependencies,
  ): AnalysisStart | Promise<AnalysisStart> {
    this.coreStart = core;
    this.applicationService.onAppStartupSubscribe(core);

    return {};
  }

  stop?(): void {}
}
