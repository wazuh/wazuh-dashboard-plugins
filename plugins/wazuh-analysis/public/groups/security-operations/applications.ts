import { Subject } from 'rxjs';
import {
  AppMountParameters,
  AppNavLinkStatus,
  AppUpdater,
  App,
} from '../../../../../src/core/public';
import { ApplicationService } from '../../../../wazuh-core/public/services/application/application';
import {
  INCIDENT_RESPONSE_ID,
  INCIDENT_RESPONSE_TITLE,
} from './apps/incident-response/constants';
import { IT_HYGIENE_ID, IT_HYGIENE_TITLE } from './apps/it-hygiene/constants';
import {
  REGULATORY_COMPLIANCE_ID,
  REGULATORY_COMPLIANCE_TITLE,
} from './apps/regulatory-compliance/constants';
import { SecurityOperationsNavGroup } from '.';

export function getSecurityOperationsApps(
  applicationService?: ApplicationService,
  updater$?: Subject<AppUpdater>,
): App[] {
  const securityOperationsLayout = applicationService?.createLayout(
    SecurityOperationsNavGroup,
  );

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

        return await renderApp(params, {
          Layout: securityOperationsLayout!(REGULATORY_COMPLIANCE_ID),
        });
      },
    },
    {
      id: IT_HYGIENE_ID,
      title: IT_HYGIENE_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        const { renderApp } = await import('./apps/it-hygiene/application');

        return await renderApp(params, {
          Layout: securityOperationsLayout!(IT_HYGIENE_ID),
        });
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

        return await renderApp(params, {
          Layout: securityOperationsLayout!(INCIDENT_RESPONSE_ID),
        });
      },
    },
  ];
}
