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
import { getCloudSecurityApps } from './applications';
import {
  CLOUD_SECURITY_DESCRIPTION,
  CLOUD_SECURITY_ID,
  CLOUD_SECURITY_TITLE,
} from './constants';

export const CloudSecurityNavGroup: Group<typeof CLOUD_SECURITY_ID> = {
  getId: () => CLOUD_SECURITY_ID,
  getTitle: () => CLOUD_SECURITY_TITLE,
  getDescription: () => CLOUD_SECURITY_DESCRIPTION,

  getNavGroup() {
    return {
      id: CLOUD_SECURITY_ID,
      title: CLOUD_SECURITY_TITLE,
      description: CLOUD_SECURITY_DESCRIPTION,
      type: NavGroupType.SYSTEM
    };
  },

  getAppGroup() {
    return {
      id: CLOUD_SECURITY_ID,
      title: CLOUD_SECURITY_TITLE,
      category: CATEGORY,
      mount: async (_params: AppMountParameters) => {
        if (!getCore().chrome.navGroup.getNavGroupEnabled()) {
          getCore().application.navigateToApp(getCloudSecurityApps()[0].id);
        }

        return () => {};
      },
    };
  },

  getGroupNavLink(): ChromeRegistrationNavLink {
    return {
      id: CLOUD_SECURITY_ID,
      title: CLOUD_SECURITY_TITLE,
      category: CATEGORY,
    };
  },

  getAppsNavLinks(): ChromeRegistrationNavLink[] {
    return getCloudSecurityApps().map(app => ({
      id: app.id,
      title: app.title,
    }));
  },

  getApps(updater$?: Subject<AppUpdater>): App[] {
    return getCloudSecurityApps(updater$);
  },
};
