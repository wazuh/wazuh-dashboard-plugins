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
import { getSecurityOperationsApps } from './applications';

export const SECURITY_OPERATIONS_ID = 'security_operations';
export const SECURITY_OPERATIONS_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${SECURITY_OPERATIONS_ID}`,
  {
    defaultMessage: 'Security Operations',
  },
);
export const SECURITY_OPERATIONS_DESCRIPTION = i18n.translate(
  `${PLUGIN_ID}.category.${SECURITY_OPERATIONS_ID}.description`,
  {
    defaultMessage:
      'Advanced monitoring and protection for devices against security threats.',
  },
);

export const SecurityOperationsNavGroup: Group = {
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
      mount:
        async (_params: AppMountParameters) =>
        // TODO: Implement the security operations application
        () => {},
    };
  },

  getGroupNavLink(): ChromeRegistrationNavLink {
    return {
      id: SECURITY_OPERATIONS_ID,
      title: SECURITY_OPERATIONS_TITLE,
      order: 0,
      category: CATEGORY,
    };
  },

  getAppsNavLinks(): ChromeRegistrationNavLink[] {
    return getSecurityOperationsApps().map(app => ({
      id: app.id,
      title: app.title,
    }));
  },

  getApps(updater$: Subject<AppUpdater>): App[] {
    return getSecurityOperationsApps(updater$);
  },

  addNavLinks(core: CoreSetup): void {
    core.chrome.navGroup.addNavLinksToGroup(
      SecurityOperationsNavGroup.getNavGroup(),
      SecurityOperationsNavGroup.getAppsNavLinks(),
    );
  },
};
