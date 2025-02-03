import {
  AppMountParameters,
  AppNavLinkStatus,
  AppUpdater,
} from 'opensearch-dashboards/public';
import { Subject } from 'rxjs';
import { i18n } from '@osd/i18n';
import { buildSubAppId } from '../../utils';
import { PLUGIN_ID } from '../../../common/constants';
import { THREAT_INTELLIGENCE_ID } from './threat-intelligence';

const THREAT_HUNTING_ID = buildSubAppId(
  THREAT_INTELLIGENCE_ID,
  'threat_hunting',
);
const VULNERABILITY_DETECTION_ID = buildSubAppId(
  THREAT_INTELLIGENCE_ID,
  'vulnerability_detection',
);
const MITRE_ATTACK_ID = buildSubAppId(THREAT_INTELLIGENCE_ID, 'mitre_attack');
const TRANSLATION_MESSAGES = Object.freeze({
  THREAT_HUNTING_TITLE: i18n.translate(
    `${PLUGIN_ID}.category.${THREAT_HUNTING_ID}`,
    {
      defaultMessage: 'Threat Hunting',
    },
  ),
  VULNERABILITY_DETECTION_TITLE: i18n.translate(
    `${PLUGIN_ID}.category.${VULNERABILITY_DETECTION_ID}`,
    {
      defaultMessage: 'Vulnerability Detection',
    },
  ),
  MITRE_ATTACK_TITLE: i18n.translate(
    `${PLUGIN_ID}.category.${MITRE_ATTACK_ID}`,
    {
      defaultMessage: 'MITRE ATT&CK',
    },
  ),
});

export function getThreatIntelligenceApps(updater$: Subject<AppUpdater>) {
  return [
    {
      id: THREAT_HUNTING_ID,
      title: TRANSLATION_MESSAGES.THREAT_HUNTING_TITLE,
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
      title: TRANSLATION_MESSAGES.VULNERABILITY_DETECTION_TITLE,
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
      title: TRANSLATION_MESSAGES.MITRE_ATTACK_TITLE,
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
