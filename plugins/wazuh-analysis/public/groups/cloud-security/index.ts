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
import { Group } from '../types';
import { CATEGORY } from '../category';
import { getCloudSecurityApps } from './applications';

export const CLOUD_SECURITY_ID = 'cloud_security';
export const CLOUD_SECURITY_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${CLOUD_SECURITY_ID}`,
  {
    defaultMessage: 'Cloud Security',
  },
);
export const CLOUD_SECURITY_DESCRIPTION = i18n.translate(
  `${PLUGIN_ID}.category.${CLOUD_SECURITY_ID}.description`,
  {
    defaultMessage:
      'Monitoring and protection for cloud environments against security threats.',
  },
);

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
      order: 0,
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
