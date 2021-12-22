import { ISecurityFactory } from '../'
import { OpenSearchDashboardsRequest, RequestHandlerContext } from 'src/core/server';
import { WAZUH_SECURITY_PLUGIN_OPEN_DISTRO_FOR_ELASTICSEARCH } from '../../../../common/constants';

export class OpendistroFactory implements ISecurityFactory {
  platform: string = WAZUH_SECURITY_PLUGIN_OPEN_DISTRO_FOR_ELASTICSEARCH;

  constructor(private opendistroSecurityKibana: any) {
  }

  async getCurrentUser(request: OpenSearchDashboardsRequest, context:RequestHandlerContext) {
    try {
      const params = {
        path: `/_opendistro/_security/api/account`,
        method: 'GET',
      };

      const {body: authContext} = await context.core.opensearch.client.asCurrentUser.transport.request(params);
      const username = this.getUserName(authContext);
      return {username, authContext};
    } catch (error) {
      throw error;
    }
  }

  getUserName(authContext:any) {
    return authContext['user_name']
  }
}
