import { i18n } from '@osd/i18n';
import {
  App,
  AppMountParameters,
  AppUpdater,
  ChromeNavGroup,
  ChromeRegistrationNavLink,
  CoreSetup,
} from 'opensearch-dashboards/public';
import { Subject } from 'rxjs';
import { PLUGIN_ID } from '../../../common/constants';
import { CATEGORY } from '../category';
import { Group } from '../types';
import { getEndpointSecurityApps } from './applications';

export const ENDPOINT_SECURITY_ID = 'endpoint_security';
export const ENDPOINT_SECURITY_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${ENDPOINT_SECURITY_ID}`,
  {
    defaultMessage: 'Endpoint Security',
  },
);
export const ENDPOINT_SECURITY_DESCRIPTION = i18n.translate(
  `${PLUGIN_ID}.category.${ENDPOINT_SECURITY_ID}.description`,
  {
    defaultMessage:
      'Advanced monitoring and protection for devices against security threats.',
  },
);

export const EndpointSecurityNavGroup: Group<typeof ENDPOINT_SECURITY_ID> = {
  getId: () => ENDPOINT_SECURITY_ID,
  getTitle: () => ENDPOINT_SECURITY_TITLE,
  getDescription: () => ENDPOINT_SECURITY_DESCRIPTION,

  getNavGroup(): ChromeNavGroup {
    return {
      id: ENDPOINT_SECURITY_ID,
      title: ENDPOINT_SECURITY_TITLE,
      description: ENDPOINT_SECURITY_DESCRIPTION,
    };
  },

  getAppGroup(): App {
    return {
      id: ENDPOINT_SECURITY_ID,
      title: ENDPOINT_SECURITY_TITLE,
      category: CATEGORY,
      mount:
        async (_params: AppMountParameters) =>
        // TODO: Implement the endpoint security landing page
        () => {},
    };
  },

  getGroupNavLink(): ChromeRegistrationNavLink {
    return {
      id: ENDPOINT_SECURITY_ID,
      title: ENDPOINT_SECURITY_TITLE,
      order: 0,
      category: CATEGORY,
    };
  },

  getAppsNavLinks(): ChromeRegistrationNavLink[] {
    return getEndpointSecurityApps().map(app => ({
      id: app.id,
      title: app.title,
    }));
  },

  getApps(updater$: Subject<AppUpdater>): App[] {
    return getEndpointSecurityApps(updater$);
  },

  addNavLinks(core: CoreSetup) {
    core.chrome.navGroup.addNavLinksToGroup(
      EndpointSecurityNavGroup.getNavGroup(),
      EndpointSecurityNavGroup.getAppsNavLinks(),
    );
  },
};
