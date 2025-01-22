import { i18n } from '@osd/i18n';
import {
  App,
  AppMountParameters,
  CoreSetup,
} from 'opensearch-dashboards/public';
import { PLUGIN_ID } from '../../../common/constants';
import { CATEGORY } from '../category';

export const THREAT_INTELLIGENCE_ID = 'threat_intelligence';
export const THREAT_INTELLIGENCE_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${THREAT_INTELLIGENCE_ID}`,
  {
    defaultMessage: 'Threat Intelligence',
  },
);
export const THREAT_INTELLIGENCE_DESCRIPTION = i18n.translate(
  `${PLUGIN_ID}.category.${THREAT_INTELLIGENCE_ID}.description`,
  {
    defaultMessage:
      'Collect and analyze information about potential threats to inform security decisions.',
  },
);

export const ThreatIntelligenceApp = (_core: CoreSetup): App => ({
  id: THREAT_INTELLIGENCE_ID,
  title: THREAT_INTELLIGENCE_TITLE,
  category: CATEGORY,
  mount:
    async (_params: AppMountParameters) =>
    // TODO: Implement the threat intelligence application
    () => {},
});
