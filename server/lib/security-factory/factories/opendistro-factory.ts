import { ISecurityFactory } from '../'

export class OpendistroFactory implements ISecurityFactory {
  server;

  constructor(server) {
    this.server = server;
  }

  async getCurrentUser(req) {
    try {
      const securityBackend = this.server.plugins.opendistro_security.getSecurityBackend()
      const authInfo = await securityBackend.authinfo(req.headers);
      return authInfo;
    } catch (error) {
      throw error; 
    }
  }
}