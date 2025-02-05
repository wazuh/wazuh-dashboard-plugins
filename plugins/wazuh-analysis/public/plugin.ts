import {
  App,
  CoreSetup,
  CoreStart,
  DEFAULT_NAV_GROUPS,
  Plugin,
} from '../../../src/core/public';
import { ApplicationService } from '../../wazuh-core/public/services/application/application';
import { searchPages } from './components/global_search/search-pages-command';
import { CloudSecurityNavGroup } from './groups/cloud-security';
import { EndpointSecurityNavGroup } from './groups/endpoint-security';
import { SecurityOperationsNavGroup } from './groups/security-operations';
import { ThreatIntelligenceNavGroup } from './groups/threat-intelligence';
import { Group, GroupsId } from './groups/types';
import {
  AnalysisSetup,
  AnalysisSetupDependencies,
  AnalysisStart,
  AnalysisStartDependencies,
} from './types';

export class AnalysisPlugin
  implements
    Plugin<AnalysisSetup, AnalysisStart, object, AnalysisStartDependencies>
{
  private coreStart?: CoreStart;
  private readonly navGroups: Group<GroupsId>[] = [
    EndpointSecurityNavGroup,
    ThreatIntelligenceNavGroup,
    SecurityOperationsNavGroup,
    CloudSecurityNavGroup,
  ];

  private registerApps(
    core: CoreSetup,
    applicationService: ApplicationService,
  ) {
    const applications: App[] = this.navGroups.map(navGroup =>
      navGroup.getAppGroup(),
    );

    applicationService.initializeNavGroupMounts(applications, core);

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

    const subApps: App[][] = this.navGroups.map(navGroup =>
      navGroup.getApps(applicationService.getAppUpdater(navGroup.getId())),
    );

    for (const apps of subApps) {
      applicationService.initializeSubApplicationMounts(apps, core);
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
    plugins: AnalysisSetupDependencies,
  ): AnalysisSetup | Promise<AnalysisSetup> {
    console.debug('AnalysisPlugin started');

    const wazuhCore = plugins.wazuhCore;

    for (const navGroup of this.navGroups) {
      wazuhCore.applicationService.registerAppUpdater(navGroup.getId());
    }

    this.registerApps(core, wazuhCore.applicationService);
    this.registerNavGroups(core);

    return {};
  }

  start(
    core: CoreStart,
    plugins: AnalysisStartDependencies,
  ): AnalysisStart | Promise<AnalysisStart> {
    const wazuhCore = plugins.wazuhCore;

    this.coreStart = core;
    wazuhCore.applicationService.onAppStartupSubscribe(core);

    return {};
  }

  stop?(): void {}
}
