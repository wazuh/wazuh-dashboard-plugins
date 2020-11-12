import { ISecurityFactory } from '../'
import { SecurityPluginSetup } from 'x-pack/plugins/security/server';
import { KibanaRequest, RequestHandlerContext } from 'src/core/server';

export class XpackFactory implements ISecurityFactory {

  constructor(private security: SecurityPluginSetup) {}

  async getCurrentUser(request: KibanaRequest) {
    try {
      const authInfo = await this.security.authc.getCurrentUser(request);
      if(!authInfo) return { username: 'elastic'};
      return authInfo;
    } catch (error) {
      throw error; 
    }
  }

}