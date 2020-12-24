import { ISecurityFactory } from '../'

export class OpendistroFactory implements ISecurityFactory {
  server;

  constructor(server) {
    this.server = server;
  }

  async getCurrentUser(req) {
    try {
      const elasticRequest = this.server.plugins.elasticsearch.getCluster('data');
      const params = {
        path: `/_opendistro/_security/api/account`,
        method: 'GET',
      };
      
      const data = await elasticRequest.callWithRequest(
        req,
        'transport.request',
        params);
      return data;
    } catch (error) {
      throw error; 
    }
  }
}