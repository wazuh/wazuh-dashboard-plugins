import { ISecurityFactory } from '../'
import { KibanaRequest, RequestHandlerContext } from 'src/core/server';

export class OpendistroFactory implements ISecurityFactory {

  constructor(private opendistroSecurity: any) {
  }

  async getCurrentUser(request: KibanaRequest, context:RequestHandlerContext) {
    try {
      const params = {
        path: `_opendistro/_security/api/account`,
        method: 'GET',
      };

      const data = await context.core.elasticsearch.client.asCurrentUser.transport.request(params);
      return data;
    } catch (error) {
      throw error; 
    }
  }
}