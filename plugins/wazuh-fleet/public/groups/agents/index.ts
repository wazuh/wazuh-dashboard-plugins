import { Subject } from 'rxjs';
import {
  App,
  AppMountParameters,
  AppUpdater,
  ChromeNavGroup,
  ChromeRegistrationNavLink,
} from '../../../../../src/core/public';
import { MANAGEMENT_CATEGORY } from '../category';
import { Group } from '../../../../wazuh-core/public/services/application/types';
import { getApps } from './applications';
import { AGENTS_DESCRIPTION, AGENTS_ID, AGENTS_TITLE } from './constants';

export const AgentsNavGroup: Group<string> = {
  getId: (): string => AGENTS_ID,
  getTitle: (): string => AGENTS_TITLE,
  getDescription: (): string => AGENTS_DESCRIPTION,

  getNavGroup(): ChromeNavGroup {
    return {
      id: AGENTS_ID,
      title: AGENTS_TITLE,
      description: AGENTS_DESCRIPTION,
    };
  },

  getAppGroup(): App {
    return {
      id: AGENTS_ID,
      title: AGENTS_TITLE,
      category: MANAGEMENT_CATEGORY,
      mount: async (_params: AppMountParameters) => () => {},
    };
  },

  getGroupNavLink(): ChromeRegistrationNavLink {
    return {
      id: AGENTS_ID,
      title: AGENTS_TITLE,
      category: MANAGEMENT_CATEGORY,
    };
  },

  getAppsNavLinks(): ChromeRegistrationNavLink[] {
    return getApps().map(app => ({
      id: app.id,
      title: app.title,
    }));
  },

  getApps(applicatinService, updater$?: Subject<AppUpdater>): App[] {
    return getApps(applicatinService, updater$);
  },
};
