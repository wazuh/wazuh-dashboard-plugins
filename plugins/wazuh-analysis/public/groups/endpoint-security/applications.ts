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
        // TODO: Implement the configuration assessment application
        const { renderApp } = await import('../../application');

        return await renderApp(params, {});
      },
    },
    {
      id: MALWARE_DETECTION_ID,
      title: MALWARE_DETECTION_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        // TODO: Implement the malware detection application
        const { renderApp } = await import('../../application');

        return await renderApp(params, {});
      },
    },
    {
      id: FIM_ID,
      title: FIM_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        // TODO: Implement the fim application
        const { renderApp } = await import('../../application');

        return await renderApp(params, {});
      },
    },
  ];
}
