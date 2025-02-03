import { i18n } from '@osd/i18n';
import {
  App,
  AppMountParameters,
  AppUpdater,
  ChromeRegistrationNavLink,
  CoreSetup,
} from 'opensearch-dashboards/public';
import { Subject } from 'rxjs';
import { PLUGIN_ID } from '../../../common/constants';
import { CATEGORY } from '../category';
import { Group } from '../types';
import { getThreatIntelligenceApps } from './applications';

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

export const ThreatIntelligenceNavGroup: Group<typeof THREAT_INTELLIGENCE_ID> =
  {
    getId: () => THREAT_INTELLIGENCE_ID,
    getTitle: () => THREAT_INTELLIGENCE_TITLE,
    getDescription: () => THREAT_INTELLIGENCE_DESCRIPTION,

    getNavGroup() {
      return {
        id: THREAT_INTELLIGENCE_ID,
        title: THREAT_INTELLIGENCE_TITLE,
        description: THREAT_INTELLIGENCE_DESCRIPTION,
      };
    },

    getAppGroup() {
      return {
        id: THREAT_INTELLIGENCE_ID,
        title: THREAT_INTELLIGENCE_TITLE,
        category: CATEGORY,
        mount:
          async (_params: AppMountParameters) =>
          // TODO: Implement the threat intelligence application
          () => {},
      };
    },

    getGroupNavLink(): ChromeRegistrationNavLink {
      return {
        id: THREAT_INTELLIGENCE_ID,
        title: THREAT_INTELLIGENCE_TITLE,
        order: 0,
        category: CATEGORY,
      };
    },

    getAppsNavLinks(): ChromeRegistrationNavLink[] {
      return getThreatIntelligenceApps().map(app => ({
        id: app.id,
        title: app.title,
      }));
    },

    getApps(updater$: Subject<AppUpdater>): App[] {
      return getThreatIntelligenceApps(updater$);
    },

    addNavLinks(core: CoreSetup): void {
      core.chrome.navGroup.addNavLinksToGroup(
        ThreatIntelligenceNavGroup.getNavGroup(),
        ThreatIntelligenceNavGroup.getAppsNavLinks(),
      );
    },
  };
