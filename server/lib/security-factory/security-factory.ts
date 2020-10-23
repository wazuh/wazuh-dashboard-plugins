import { OpendistroFactory, XpackFactory, DefaultFactory } from './factories';
import { WAZUH_SECURITY_PLUGIN_XPACK_SECURITY, WAZUH_SECURITY_PLUGIN_OPEN_DISTRO_FOR_ELASTICSEARCH } from '../../../util/constants';

export interface ISecurityFactory {
  getCurrentUser(req): Promise<{ user }> 
}

export function SecurityObj(platform, server) {
  switch(platform){
    case WAZUH_SECURITY_PLUGIN_XPACK_SECURITY:
      return new XpackFactory(server);
    case WAZUH_SECURITY_PLUGIN_OPEN_DISTRO_FOR_ELASTICSEARCH:
      return new OpendistroFactory(server);
    default:
      return new DefaultFactory(server);
  }
}