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
  SecurityOperationsNavGroup,
} from './groups/security-operations';
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
import { GroupsId } from './groups/types';
import { ApplicationService } from './services/application.service';
import {
  ENDPOINT_SECURITY_ID,
  EndpointSecurityNavGroup,
} from './groups/endpoint-security';
import {
  CLOUD_SECURITY_ID,
  CloudSecurityNavGroup,
} from './groups/cloud-security';

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
      SecurityOperationsNavGroup.getAppGroup(),
      CloudSecurityNavGroup.getAppGroup(),
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
      [SECURITY_OPERATIONS_ID]: SecurityOperationsNavGroup.getApps(
        this.applicationService.getAppUpdater(SECURITY_OPERATIONS_ID),
      ),
      [CLOUD_SECURITY_ID]: CloudSecurityNavGroup.getApps(
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

    SecurityOperationsNavGroup.addNavLinks(core);
    CloudSecurityNavGroup.addNavLinks(core);

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.all, [
      EndpointSecurityNavGroup.getGroupNavLink(),
      {
        id: THREAT_INTELLIGENCE_ID,
        title: THREAT_INTELLIGENCE_TITLE,
        order: 1,
        category: CATEGORY,
      },
      SecurityOperationsNavGroup.getGroupNavLink(),
      CloudSecurityNavGroup.getGroupNavLink(),
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
