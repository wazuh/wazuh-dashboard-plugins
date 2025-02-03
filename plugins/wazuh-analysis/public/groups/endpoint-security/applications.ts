import {
  AppMountParameters,
  AppNavLinkStatus,
  AppUpdater,
} from 'opensearch-dashboards/public';
import { Subject } from 'rxjs';
import { i18n } from '@osd/i18n';
import { buildSubAppId } from '../../utils';
import { PLUGIN_ID } from '../../../common/constants';
import { ENDPOINT_SECURITY_ID } from './endpoint-security';

const CONFIGURATION_ASSESSMENT_ID = buildSubAppId(
  ENDPOINT_SECURITY_ID,
  'configuration_assessment',
);
const MALWARE_DETECTION_ID = buildSubAppId(
  ENDPOINT_SECURITY_ID,
  'malware_detection',
);
const FIM_ID = buildSubAppId(ENDPOINT_SECURITY_ID, 'fim');
const TRANSLATION_MESSAGES = Object.freeze({
  CONFIGURATION_ASSESSMENT_TITLE: i18n.translate(
    `${PLUGIN_ID}.category.${CONFIGURATION_ASSESSMENT_ID}`,
    {
      defaultMessage: 'Configuration Assessment',
    },
  ),
  MALWARE_DETECTION_TITLE: i18n.translate(
    `${PLUGIN_ID}.category.${MALWARE_DETECTION_ID}`,
    {
      defaultMessage: 'Malware Detection',
    },
  ),
  FIM_TITLE: i18n.translate(`${PLUGIN_ID}.category.${FIM_ID}`, {
    defaultMessage: 'File Integrity Monitoring',
  }),
});

export function getEndpointSecurityApps(updater$: Subject<AppUpdater>) {
  return [
    {
      id: CONFIGURATION_ASSESSMENT_ID,
      title: TRANSLATION_MESSAGES.CONFIGURATION_ASSESSMENT_TITLE,
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
      title: TRANSLATION_MESSAGES.MALWARE_DETECTION_TITLE,
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
      title: TRANSLATION_MESSAGES.FIM_TITLE,
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
