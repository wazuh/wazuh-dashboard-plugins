import { Subject } from 'rxjs';
import {
  AppMountParameters,
  AppNavLinkStatus,
  AppUpdater,
} from '../../../../../src/core/public';
import {
  MITRE_ATTACK_ID,
  MITRE_ATTACK_TITLE,
} from './apps/mitre-att&ck/constants';
import {
  THREAT_HUNTING_ID,
  THREAT_HUNTING_TITLE,
} from './apps/threat-hunting/constants';
import {
  VULNERABILITY_DETECTION_ID,
  VULNERABILITY_DETECTION_TITLE,
} from './apps/vulnerability-detection/constants';

export function getThreatIntelligenceApps(updater$?: Subject<AppUpdater>) {
  return [
    {
      id: THREAT_HUNTING_ID,
      title: THREAT_HUNTING_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        const { renderApp } = await import('./apps/threat-hunting/application');

        return await renderApp(params);
      },
    },
    {
      id: VULNERABILITY_DETECTION_ID,
      title: VULNERABILITY_DETECTION_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        const { renderApp } = await import(
          './apps/vulnerability-detection/application'
        );

        return await renderApp(params);
      },
    },
    {
      id: MITRE_ATTACK_ID,
      title: MITRE_ATTACK_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        const { renderApp } = await import('./apps/mitre-att&ck/application');

        return await renderApp(params);
      },
    },
  ];
}
