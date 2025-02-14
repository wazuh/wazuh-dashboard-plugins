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
import { getSecurityOperationsApps } from './applications';
import {
  SECURITY_OPERATIONS_DESCRIPTION,
  SECURITY_OPERATIONS_ID,
  SECURITY_OPERATIONS_TITLE,
} from './constants';

export const SecurityOperationsNavGroup: Group<typeof SECURITY_OPERATIONS_ID> =
  {
    getId: () => SECURITY_OPERATIONS_ID,
    getTitle: () => SECURITY_OPERATIONS_TITLE,
    getDescription: () => SECURITY_OPERATIONS_DESCRIPTION,

    getNavGroup() {
      return {
        id: SECURITY_OPERATIONS_ID,
        title: SECURITY_OPERATIONS_TITLE,
        description: SECURITY_OPERATIONS_DESCRIPTION,
      };
    },

    getAppGroup() {
      return {
        id: SECURITY_OPERATIONS_ID,
        title: SECURITY_OPERATIONS_TITLE,
        category: CATEGORY,
        mount: async (_params: AppMountParameters) => () => {},
      };
    },

    getGroupNavLink(): ChromeRegistrationNavLink {
      return {
        id: SECURITY_OPERATIONS_ID,
        title: SECURITY_OPERATIONS_TITLE,
        category: CATEGORY,
      };
    },

    getAppsNavLinks(): ChromeRegistrationNavLink[] {
      return getSecurityOperationsApps().map(app => ({
        id: app.id,
        title: app.title,
      }));
    },

    getApps(
      applicationService: ApplicationService,
      updater$: Subject<AppUpdater>,
    ): App[] {
      return getSecurityOperationsApps(applicationService, updater$);
    },
  };
