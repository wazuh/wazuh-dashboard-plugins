import {
  OpenSearchDashboardsSecurityFactory,
  DefaultFactory,
} from './factories';
import {
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from 'src/core/server';
import { PluginSetup } from '../../types';
import { getCookieValueByName } from '../cookie';
import jwtDecode from 'jwt-decode';
import { WAZUH_ROLE_ADMINISTRATOR_ID } from '../../../common/constants';

type CurrentUser = {
  username?: string;
  authContext: { [key: string]: any };
};

export interface ISecurityFactory {
  platform?: string;
  getCurrentUser(
    request: OpenSearchDashboardsRequest,
    context?: RequestHandlerContext,
  ): Promise<CurrentUser>;
  isAdministratorUser(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
  ): Promise<void>;
}

export function createDashboardSecurity({
  securityDashboards,
}: PluginSetup): ISecurityFactory {
  const dashboardSecurity = !!securityDashboards
    ? new OpenSearchDashboardsSecurityFactory()
    : new DefaultFactory();

  enhanceDashboardSecurity(dashboardSecurity);
  return dashboardSecurity;
}

function enhanceDashboardSecurity(dashboardSecurity) {
  dashboardSecurity.isAdministratorUser = async function (context, request) {
    try {
      // Check if user has administrator role in token
      const token = getCookieValueByName(request.headers.cookie, 'wz-token');
      if (!token) {
        return {
          administrator: false,
          administrator_requirements: 'No token provider',
        };
      }
      const decodedToken = jwtDecode(token);
      if (!decodedToken) {
        return {
          administrator: false,
          administrator_requirements: 'No permissions in token',
        };
      }
      if (
        !decodedToken.rbac_roles ||
        !decodedToken.rbac_roles.includes(WAZUH_ROLE_ADMINISTRATOR_ID)
      ) {
        return {
          administrator: false,
          administrator_requirements: 'No administrator role',
        };
      }
      // Check the provided token is valid
      const apiHostID = getCookieValueByName(request.headers.cookie, 'wz-api');
      if (!apiHostID) {
        return {
          administrator: false,
          administrator_requirements: 'No API id provided',
        };
      }
      const responseTokenIsWorking =
        await context.wazuh_core.api.client.asCurrentUser.request(
          'GET',
          '/',
          {},
          { apiHostID },
        );
      if (responseTokenIsWorking.status !== 200) {
        return {
          administrator: false,
          administrator_requirements: 'Token is not valid',
        };
      }
      return {
        administrator: true,
        administrator_requirements: null,
      };
    } catch (error) {
      return {
        administror: false,
        administrator_requirements: `It could not check if the current user is administrator due to: ${error.message}`,
      };
    }
  };
}
