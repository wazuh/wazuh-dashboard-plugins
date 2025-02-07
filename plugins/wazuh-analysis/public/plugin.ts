import { CoreSetup, CoreStart, Plugin } from '../../../src/core/public';
import { Group } from '../../wazuh-core/public/services/application/types';
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

  public setup(
    core: CoreSetup,
    plugins: AnalysisSetupDependencies,
  ): AnalysisSetup | Promise<AnalysisSetup> {
    console.debug('AnalysisPlugin started');
    plugins.wazuhCore.applicationService.setup({
      id: 'wz-analysis',
      navGroups: this.navGroups,
      coreSetup: core,
      getCoreStart: getCore,
    });

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
