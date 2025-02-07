import { App, CoreSetup, CoreStart, Plugin } from '../../../src/core/public';
import { ApplicationService } from '../../wazuh-core/public/services/application/application';
import { Group } from '../../wazuh-core/public/services/application/types';
import { searchPages } from './components/global_search/search-pages-command';
import { CloudSecurityNavGroup } from './groups/cloud-security';
import { EndpointSecurityNavGroup } from './groups/endpoint-security';
import { SecurityOperationsNavGroup } from './groups/security-operations';
import { ThreatIntelligenceNavGroup } from './groups/threat-intelligence';
import { GroupsId } from './groups/types';
import { getCore, setCore } from './plugin-services';
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
    const applicationIds = applications.map(app => app.id);

    if (core.chrome.navGroup.getNavGroupEnabled()) {
      core.chrome.globalSearch.registerSearchCommand({
        id: 'wz-analysis',
        type: 'PAGES',
        run: async (query: string, done?: () => void) =>
          searchPages(query, applicationIds, getCore(), done),
      });
    }

    const subApps: App[][] = this.navGroups.map(navGroup =>
      navGroup.getApps(applicationService.getAppUpdater(navGroup.getId())),
    );

    for (const apps of subApps) {
      applicationService.modifySubAppsMount(apps, core);
    }
  }

  public setup(
    core: CoreSetup,
    plugins: AnalysisSetupDependencies,
  ): AnalysisSetup | Promise<AnalysisSetup> {
    console.debug('AnalysisPlugin started');

    const wazuhCore = plugins.wazuhCore;

    wazuhCore.applicationService.setup(this.navGroups, core);
    this.registerApps(core, wazuhCore.applicationService);

    return {};
  }

  start(
    core: CoreStart,
    plugins: AnalysisStartDependencies,
  ): AnalysisStart | Promise<AnalysisStart> {
    setCore(core);

    const wazuhCore = plugins.wazuhCore;

    wazuhCore.applicationService.onAppStartupSubscribe(core);

    return {};
  }

  stop?(): void {}
}
