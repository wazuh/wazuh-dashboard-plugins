import { Subject } from 'rxjs';
import {
  App,
  AppMountParameters,
  AppUpdater,
  ChromeNavGroup,
  ChromeRegistrationNavLink,
} from '../../../../../src/core/public';
import { CATEGORY } from '../category';
import { Group } from '../../../../wazuh-core/public/services/application/types';
import { getEndpointSecurityApps } from './applications';
import {
  ENDPOINT_SECURITY_DESCRIPTION,
  ENDPOINT_SECURITY_ID,
  ENDPOINT_SECURITY_TITLE,
} from './constants';

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
      mount: async (_params: AppMountParameters) => () => {},
    };
  },

  getGroupNavLink(): ChromeRegistrationNavLink {
    return {
      id: ENDPOINT_SECURITY_ID,
      title: ENDPOINT_SECURITY_TITLE,
      category: CATEGORY,
    };
  },

  getAppsNavLinks(): ChromeRegistrationNavLink[] {
    return getEndpointSecurityApps().map(app => ({
      id: app.id,
      title: app.title,
    }));
  },

  getApps(updater$?: Subject<AppUpdater>): App[] {
    return getEndpointSecurityApps(updater$);
  },
};
