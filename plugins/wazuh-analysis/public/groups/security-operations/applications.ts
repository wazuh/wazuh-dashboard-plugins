import {
  AppMountParameters,
  AppNavLinkStatus,
  AppUpdater,
} from 'opensearch-dashboards/public';
import { Subject } from 'rxjs';
import { i18n } from '@osd/i18n';
import { buildSubAppId } from '../../utils';
import { PLUGIN_ID } from '../../../common/constants';
import { SECURITY_OPERATIONS_ID } from '.';

export const REGULATORY_COMPLIANCE_ID = buildSubAppId(
  SECURITY_OPERATIONS_ID,
  'regulatory_compliance',
);
export const IT_HYGIENE_ID = buildSubAppId(
  SECURITY_OPERATIONS_ID,
  'it_hygiene',
);
export const INCIDENT_RESPONSE_ID = buildSubAppId(
  SECURITY_OPERATIONS_ID,
  'incident_response',
);
export const REGULATORY_COMPLIANCE_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${REGULATORY_COMPLIANCE_ID}`,
  {
    defaultMessage: 'Regulatory Compliance',
  },
);
export const IT_HYGIENE_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${IT_HYGIENE_ID}`,
  {
    defaultMessage: 'IT Hygiene',
  },
);
export const INCIDENT_RESPONSE_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${INCIDENT_RESPONSE_ID}`,
  {
    defaultMessage: 'Incident Response',
  },
);

export function getSecurityOperationsApps(updater$?: Subject<AppUpdater>) {
  return [
    {
      id: REGULATORY_COMPLIANCE_ID,
      title: REGULATORY_COMPLIANCE_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        // TODO: Implement the regulatory compliance application
        const { renderApp } = await import('../../application');

        return await renderApp(params, {});
      },
    },
    {
      id: IT_HYGIENE_ID,
      title: IT_HYGIENE_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        // TODO: Implement the it hygiene application
        const { renderApp } = await import('../../application');

        return await renderApp(params, {});
      },
    },
    {
      id: INCIDENT_RESPONSE_ID,
      title: INCIDENT_RESPONSE_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        // TODO: Implement the incident response application
        const { renderApp } = await import('../../application');

        return await renderApp(params, {});
      },
    },
  ];
}
