import { ISecurityFactory } from '../'
import { SecurityPluginSetup } from 'x-pack/plugins/security/server';
import { KibanaRequest, RequestHandlerContext } from 'src/core/server';
import { WAZUH_SECURITY_PLUGIN_XPACK_SECURITY } from '../../../../util/constants';

export class XpackFactory implements ISecurityFactory {
  platform = WAZUH_SECURITY_PLUGIN_XPACK_SECURITY;
  constructor(private security: SecurityPluginSetup) {}

  async getCurrentUser(request: KibanaRequest) {
    try {
      const authContext = await this.security.authc.getCurrentUser(request);
      if(!authContext) return {userName: 'elastic', authContext: { username: 'elastic'}};
      const userName = this.getUserName(authContext);
      return {userName, authContext};
    } catch (error) {
      throw error; 
    }
  }

  getUserName(authContext:any) {
    return authContext['user_name']
  }
}