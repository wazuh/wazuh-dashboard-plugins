import { Subject } from 'rxjs';
import {
  App,
  AppMountParameters,
  AppUpdater,
  ChromeRegistrationNavLink,
  NavGroupType,
} from '../../../../../src/core/public';
import { CATEGORY } from '../category';
import { getCore } from '../../plugin-services';
import { Group } from '../../../../wazuh-core/public/services/application/types';
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
        type: NavGroupType.SYSTEM,
      };
    },

    getAppGroup() {
      return {
        id: SECURITY_OPERATIONS_ID,
        title: SECURITY_OPERATIONS_TITLE,
        category: CATEGORY,
        mount: async (_params: AppMountParameters) => {
          if (!getCore().chrome.navGroup.getNavGroupEnabled()) {
            getCore().application.navigateToApp(
              getSecurityOperationsApps()[0].id,
            );
          }

          return () => {};
        },
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

    getApps(updater$?: Subject<AppUpdater>): App[] {
      return getSecurityOperationsApps(updater$);
    },
  };
