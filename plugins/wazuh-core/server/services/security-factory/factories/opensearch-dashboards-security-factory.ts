import { ISecurityFactory } from '..';
import {
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from 'opensearch-dashboards/server';
import md5 from 'md5';
import { WAZUH_SECURITY_PLUGIN_OPENSEARCH_DASHBOARDS_SECURITY } from '../../../../common/constants';

export class OpenSearchDashboardsSecurityFactory implements ISecurityFactory {
  platform: string = WAZUH_SECURITY_PLUGIN_OPENSEARCH_DASHBOARDS_SECURITY;
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
    const response = await context.security_plugin.esClient
      .asScoped(request)
      .callAsCurrentUser('opensearch_security.restapiinfo');

    if (!response.has_api_access) {
      throw new Error(`User has no permission for rest API access.`);
    }
  }
}
