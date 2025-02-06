import { Subject } from 'rxjs';
import {
  App,
  AppMountParameters,
  AppUpdater,
  ChromeRegistrationNavLink,
  CoreSetup,
} from '../../../../../src/core/public';
import { Group } from '../types';
import { CATEGORY } from '../category';
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
    };
  },

  getAppGroup() {
    return {
      id: CLOUD_SECURITY_ID,
      title: CLOUD_SECURITY_TITLE,
      category: CATEGORY,
      mount:
        async (_params: AppMountParameters) =>
        // TODO: Implement the cloud security application
        () => {},
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

  getApps(updater$: Subject<AppUpdater>): App[] {
    return getCloudSecurityApps(updater$);
  },

  addNavLinks(core: CoreSetup): void {
    core.chrome.navGroup.addNavLinksToGroup(
      CloudSecurityNavGroup.getNavGroup(),
      CloudSecurityNavGroup.getAppsNavLinks(),
    );
  },
};
