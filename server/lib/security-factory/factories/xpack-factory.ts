import { ISecurityFactory } from '../'
import { SecurityPluginSetup } from 'x-pack/plugins/security/server';
import { KibanaRequest } from 'src/core/server';
import { WAZUH_SECURITY_PLUGIN_XPACK_SECURITY } from '../../../../common/constants';

export class XpackFactory implements ISecurityFactory {
  platform: string = WAZUH_SECURITY_PLUGIN_XPACK_SECURITY;
  constructor(private security: SecurityPluginSetup) {}

  async getCurrentUser(request: KibanaRequest) {
    try {
      const authContext = await this.security.authc.getCurrentUser(request);
      if(!authContext) return {username: 'elastic', authContext: { username: 'elastic'}};
      const username = this.getUserName(authContext);
      return {username, authContext};
    } catch (error) {
      throw error; 
    }
  }

  getUserName(authContext:any) {
    return authContext['username'];
  }
}