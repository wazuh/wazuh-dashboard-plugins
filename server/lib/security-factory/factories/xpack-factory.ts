import { ISecurityFactory } from '../'

export class XpackFactory implements ISecurityFactory {
  server;

  constructor(server) {
    this.server = server;
  }

  async getCurrentUser(req) {
    try {
      const authInfo = await this.server.plugins.security.getUser(req);
      return authInfo;
    } catch (error) {
      throw error; 
    }
  }

}