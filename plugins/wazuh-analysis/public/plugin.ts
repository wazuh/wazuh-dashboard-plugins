import {
  App,
  CoreSetup,
  CoreStart,
  DEFAULT_NAV_GROUPS,
  Plugin,
} from '../../../src/core/public';
import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';
import { searchPages } from './components/global_search/search-pages-command';
import { CloudSecurityNavGroup } from './groups/cloud-security';
import { EndpointSecurityNavGroup } from './groups/endpoint-security';
import { SecurityOperationsNavGroup } from './groups/security-operations';
import { ThreatIntelligenceNavGroup } from './groups/threat-intelligence';
import { Group, GroupsId } from './groups/types';
import { ApplicationService } from './services/application.service';
import { AnalysisSetup, AnalysisStart } from './types';

interface AnalysisSetupDependencies {}

interface AnalysisStartDependencies {
  navigation: NavigationPublicPluginStart;
}

export class AnalysisPlugin
  implements
    Plugin<AnalysisSetup, AnalysisStart, object, AnalysisStartDependencies>
{
  private readonly applicationService = new ApplicationService();
  private coreStart?: CoreStart;
  private readonly navGroups: Group<GroupsId>[] = [
    EndpointSecurityNavGroup,
    ThreatIntelligenceNavGroup,
    SecurityOperationsNavGroup,
    CloudSecurityNavGroup,
  ];

  constructor() {
    for (const navGroup of this.navGroups) {
      this.applicationService.registerAppUpdater(navGroup.getId());
    }
  }

  private registerApps(core: CoreSetup) {
    const applications: App[] = this.navGroups.map(navGroup =>
      navGroup.getAppGroup(),
    );

    this.applicationService.initializeNavGroupMounts(applications, core);

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

    const subApps: App[] = this.navGroups.map(navGroup =>
      navGroup.getApps(this.applicationService.getAppUpdater(navGroup.getId())),
    );

    for (const apps of subApps) {
      this.applicationService.initializeSubApplicationMounts(apps, core);
    }
  }

  private registerNavGroups(core: CoreSetup) {
    for (const navGroup of this.navGroups) {
      navGroup.addNavLinks(core);
      core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.all, [
        navGroup.getGroupNavLink(),
      ]);
    }
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
