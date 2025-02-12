import { Subject } from 'rxjs';
import {
  AppMountParameters,
  AppNavLinkStatus,
  AppUpdater,
} from '../../../../../src/core/public';
import {
  IT_HYGIENE_ID,
  IT_HYGIENE_TITLE,
  REGULATORY_COMPLIANCE_ID,
  REGULATORY_COMPLIANCE_TITLE,
} from './constants';
import {
  INCIDENT_RESPONSE_ID,
  INCIDENT_RESPONSE_TITLE,
} from './apps/incident-response/constants';

export function getSecurityOperationsApps(updater$?: Subject<AppUpdater>) {
  return [
    {
      id: REGULATORY_COMPLIANCE_ID,
      title: REGULATORY_COMPLIANCE_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        const { renderApp } = await import(
          './apps/regulatory-compliance/application'
        );

        return await renderApp(params);
      },
    },
    {
      id: IT_HYGIENE_ID,
      title: IT_HYGIENE_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        const { renderApp } = await import('./apps/it-hygiene/application');

        return await renderApp(params);
      },
    },
    {
      id: INCIDENT_RESPONSE_ID,
      title: INCIDENT_RESPONSE_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        const { renderApp } = await import(
          './apps/incident-response/application'
        );

        return await renderApp(params);
      },
    },
  ];
}
