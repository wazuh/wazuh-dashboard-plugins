import { ISecurityFactory } from '../'
import { KibanaRequest, RequestHandlerContext } from 'src/core/server';
import { WAZUH_SECURITY_PLUGIN_OPEN_DISTRO_FOR_ELASTICSEARCH } from '../../../../util/constants';

export class OpendistroFactory implements ISecurityFactory {
  platform: WAZUH_SECURITY_PLUGIN_OPEN_DISTRO_FOR_ELASTICSEARCH;

  constructor(private opendistroSecurity: any) {
  }

  async getCurrentUser(request: KibanaRequest, context:RequestHandlerContext) {
    try {
      const params = {
        path: `_opendistro/_security/api/account`,
        method: 'GET',
      };

      const authContext = await context.core.elasticsearch.client.asCurrentUser.transport.request(params);
      const userName = this.getUserName(authContext);
      return {userName, authContext};
    } catch (error) {
      throw error; 
    }
  }

  getUserName(authContext:any) {
    return authContext['username']
  }
}