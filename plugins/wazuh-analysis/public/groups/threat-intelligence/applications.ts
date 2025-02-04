import { Subject } from 'rxjs';
import {
  AppMountParameters,
  AppNavLinkStatus,
  AppUpdater,
} from '../../../../../src/core/public';
import {
  MITRE_ATTACK_ID,
  MITRE_ATTACK_TITLE,
  THREAT_HUNTING_ID,
  THREAT_HUNTING_TITLE,
  VULNERABILITY_DETECTION_ID,
  VULNERABILITY_DETECTION_TITLE,
} from './constants';

export function getThreatIntelligenceApps(updater$?: Subject<AppUpdater>) {
  return [
    {
      id: THREAT_HUNTING_ID,
      title: THREAT_HUNTING_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        // TODO: Implement the threat hunting application
        const { renderApp } = await import('../../application');

        return await renderApp(params, {});
      },
    },
    {
      id: VULNERABILITY_DETECTION_ID,
      title: VULNERABILITY_DETECTION_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        // TODO: Implement the vulnerability detection application
        const { renderApp } = await import('../../application');

        return await renderApp(params, {});
      },
    },
    {
      id: MITRE_ATTACK_ID,
      title: MITRE_ATTACK_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        // TODO: Implement the mitre attack application
        const { renderApp } = await import('../../application');

        return await renderApp(params, {});
      },
    },
  ];
}
