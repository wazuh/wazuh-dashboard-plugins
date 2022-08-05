import { ISecurityFactory } from '../'
import { SecurityPluginSetup } from 'x-pack/plugins/security/server';
import { KibanaRequest } from 'src/core/server';
import { WAZUH_SECURITY_PLUGIN_XPACK_SECURITY, ELASTIC_NAME } from '../../../../common/constants';
import md5 from 'md5';

export class XpackFactory implements ISecurityFactory {
  platform: string = WAZUH_SECURITY_PLUGIN_XPACK_SECURITY;
  constructor(private security: SecurityPluginSetup) {}

  async getCurrentUser(request: KibanaRequest) {
    try {
      const authContext = await this.security.authc.getCurrentUser(request);
      if(!authContext) return {hashUsername: md5(ELASTIC_NAME), username: ELASTIC_NAME, authContext: { username: ELASTIC_NAME}};
      const username = this.getUserName(authContext);
      return { username, authContext, hashUsername: md5(username) };
    } catch (error) {
      throw error; 
    }
  }

  getUserName(authContext:any) {
    return authContext['username'];
  }
}