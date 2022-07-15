import { ISecurityFactory } from '..'
import { OpenSearchDashboardsRequest, RequestHandlerContext } from 'src/core/server';
import { WAZUH_SECURITY_PLUGIN_OPENSEARCH_DASHBOARDS_SECURITY } from '../../../../common/constants';
import md5 from 'md5';

export class OpenSearchDashboardsSecurityFactory implements ISecurityFactory {
  platform: string = WAZUH_SECURITY_PLUGIN_OPENSEARCH_DASHBOARDS_SECURITY;

  constructor(private securityDashboards: any) {
  }

  async getCurrentUser(request: OpenSearchDashboardsRequest, context:RequestHandlerContext) {
    try {
      const params = {
        path: `/_opendistro/_security/api/account`,
        method: 'GET',
      };

      const {body: authContext} = await context.core.opensearch.client.asCurrentUser.transport.request(params);
      const username = this.getUserName(authContext);
      return { username, authContext, hashUsername: md5(username) };
    } catch (error) {
      throw error;
    }
  }

  getUserName(authContext:any) {
    return authContext['user_name']
  }
}
