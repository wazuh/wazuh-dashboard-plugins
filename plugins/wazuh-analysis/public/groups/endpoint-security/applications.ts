import { Subject } from 'rxjs';
import {
  App,
  AppMountParameters,
  AppNavLinkStatus,
  AppUpdater,
} from '../../../../../src/core/public';
import {
  CONFIGURATION_ASSESSMENT_ID,
  CONFIGURATION_ASSESSMENT_TITLE,
  FIM_ID,
  FIM_TITLE,
  MALWARE_DETECTION_ID,
  MALWARE_DETECTION_TITLE,
} from './constants';

export function getEndpointSecurityApps(updater$?: Subject<AppUpdater>): App[] {
  return [
    {
      id: CONFIGURATION_ASSESSMENT_ID,
      title: CONFIGURATION_ASSESSMENT_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        const { renderApp } = await import(
          './apps/configuration-assesment/application'
        );

        return await renderApp(params);
      },
    },
    {
      id: MALWARE_DETECTION_ID,
      title: MALWARE_DETECTION_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        const { renderApp } = await import(
          './apps/malware-detection/application'
        );

        return await renderApp(params);
      },
    },
    {
      id: FIM_ID,
      title: FIM_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        const { renderApp } = await import('./apps/fim/application');

        return await renderApp(params);
      },
    },
  ];
}
