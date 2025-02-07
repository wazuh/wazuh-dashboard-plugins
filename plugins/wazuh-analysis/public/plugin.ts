import { CoreSetup, CoreStart, Plugin } from '../../../src/core/public';
import { Group } from '../../wazuh-core/public/services/application/types';
import { CloudSecurityNavGroup } from './groups/cloud-security';
import { EndpointSecurityNavGroup } from './groups/endpoint-security';
import { SecurityOperationsNavGroup } from './groups/security-operations';
import { ThreatIntelligenceNavGroup } from './groups/threat-intelligence';
import { GroupsId } from './groups/types';
import { setCore } from './plugin-services';
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

  public setup(
    core: CoreSetup,
    plugins: AnalysisSetupDependencies,
  ): AnalysisSetup | Promise<AnalysisSetup> {
    console.debug(`${AnalysisPlugin.name} setup`);
    plugins.wazuhCore.applicationService.setup({
      id: 'wz-analysis',
      navGroups: this.navGroups,
    });

    return {};
  }

  start(
    core: CoreStart,
    plugins: AnalysisStartDependencies,
  ): AnalysisStart | Promise<AnalysisStart> {
    console.debug(`${AnalysisPlugin.name} start`);
    setCore(core);

    plugins.wazuhCore.applicationService.onAppStartup(core);

    return {};
  }

  stop?(): void {
    console.debug(`${AnalysisPlugin.name} stop`);
  }
}
