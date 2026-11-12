import { ISecurityFactory } from '..';
import {
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from 'opensearch-dashboards/server';
import md5 from 'md5';
import { WAZUH_SECURITY_PLUGIN_OPENSEARCH_DASHBOARDS_SECURITY } from '../../../../common/constants';

export class OpenSearchDashboardsSecurityFactory implements ISecurityFactory {
  platform: string = WAZUH_SECURITY_PLUGIN_OPENSEARCH_DASHBOARDS_SECURITY;
  // Keys of the response of the security plugin account API
  authContextFields: string[] = [
    'backend_roles',
    'custom_attribute_names',
    'is_hidden',
    'is_internal_user',
    'is_reserved',
    'roles',
    'tenants',
    'user_name',
    'user_requested_tenant',
  ];
  constructor() {}

  async getCurrentUser(
    request: OpenSearchDashboardsRequest,
    context: RequestHandlerContext,
  ) {
    try {
      const params = {
        path: `/_opendistro/_security/api/account`,
        method: 'GET',
      };

      const { body: authContext } =
        await context.core.opensearch.client.asCurrentUser.transport.request(
          params,
        );
      const username = this.getUserName(authContext);
      return { username, authContext, hashUsername: md5(username) };
    } catch (error) {
      throw error;
    }
  }

  getUserName(authContext: any) {
    return authContext['user_name'];
  }

  async isAdministratorUser(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
  ) {
    // This is replaced after creating the instance
  }
}
