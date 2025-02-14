import { Subject } from 'rxjs';
import {
  App,
  AppMountParameters,
  AppUpdater,
  ChromeRegistrationNavLink,
} from '../../../../../src/core/public';
import { CATEGORY } from '../category';
import { Group } from '../../../../wazuh-core/public/services/application/types';
import { ApplicationService } from '../../../../wazuh-core/public/services/application/application';
import { getThreatIntelligenceApps } from './applications';
import {
  THREAT_INTELLIGENCE_DESCRIPTION,
  THREAT_INTELLIGENCE_ID,
  THREAT_INTELLIGENCE_TITLE,
} from './constants';

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
        mount: async (_params: AppMountParameters) => () => {},
      };
    },

    getGroupNavLink(): ChromeRegistrationNavLink {
      return {
        id: THREAT_INTELLIGENCE_ID,
        title: THREAT_INTELLIGENCE_TITLE,
        category: CATEGORY,
      };
    },

    getAppsNavLinks(): ChromeRegistrationNavLink[] {
      return getThreatIntelligenceApps().map(app => ({
        id: app.id,
        title: app.title,
      }));
    },

    getApps(
      applicationService: ApplicationService,
      updater$: Subject<AppUpdater>,
    ): App[] {
      return getThreatIntelligenceApps(applicationService, updater$);
    },
  };
